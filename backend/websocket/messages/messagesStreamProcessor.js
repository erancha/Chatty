const { unmarshall } = require('@aws-sdk/util-dynamodb');
const Redis = require('ioredis');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);
const STACK_NAME = process.env.STACK_NAME;

// Lua script
const luaScript = `
local STACK_NAME = ARGV[1]
local chatId = ARGV[2]
local newItem = ARGV[3]
local maxItems = tonumber(ARGV[4])

local chatMessagesKey = STACK_NAME .. ":messages(" .. chatId .. ")"

-- Check if the cache exists (otherwise the new item will not be inserted, and previous messages will be loaded when the first subsequent client will authenticate).
if redis.call('EXISTS', chatMessagesKey) > 0 then
  -- Insert the new item at the beginning of the list
  redis.call('LPUSH', chatMessagesKey, newItem)

  -- Remove the last item if the current length (including the new item) exceeds the maxItems limit
  local length = redis.call('LLEN', chatMessagesKey)
  if length > maxItems then
      redis.call('RPOP', chatMessagesKey)
  end
end
`;

//===========================================
// handler:
//===========================================
exports.handler = async (event) => {
  // Extract table name from the event records (assuming all records are from the same table)
  const tableName = event.Records[0].eventSourceARN.split(':')[5].split('/')[1];

  try {
    for (const record of event.Records) {
      // console.log(`${tableName}: Stream record: ${JSON.stringify(record)}`);

      if (record.eventName === 'INSERT') {
        const newItem = unmarshall(record.dynamodb.NewImage);

        // Execute the Lua script to insert the new item and manage the list
        await redisClient.eval(
          luaScript,
          0,
          STACK_NAME,
          newItem.chatId,
          JSON.stringify({
            id: newItem.id,
            timestamp: new Date(newItem.updatedAt).getTime(),
            content: newItem.content,
            sender: newItem.sender,
            viewed: true,
          }),
          100 // max items
        );
      } else if (record.eventName === 'MODIFY' || record.eventName === 'REMOVE') {
        // Invalidate the cache:
        const chatId = 'global'; // record.eventName === 'MODIFY' ? unmarshall(record.dynamodb.NewImage).chatId : unmarshall(record.dynamodb.OldImage).chatId;
        const chatMessagesKey = `${STACK_NAME}:messages(${chatId})`;
        await redisClient.del(chatMessagesKey);
      }
    }

    return { statusCode: 200, body: 'Successfully processed DynamoDB Stream records' };
  } catch (error) {
    console.error(`${JSON.stringify(event)} : `, error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
