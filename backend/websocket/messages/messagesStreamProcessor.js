const { unmarshall } = require('@aws-sdk/util-dynamodb');
const Redis = require('ioredis');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

const STACK_NAME = process.env.STACK_NAME;

// Lua script
const luaScript = `
local chatMessagesKey = ARGV[1]
local newItem = ARGV[2]
local maxItems = tonumber(ARGV[3])

-- Insert the new item at the beginning of the list
redis.call('LPUSH', chatMessagesKey, newItem)

-- Get the current length of the list
local length = redis.call('LLEN', chatMessagesKey)

-- Remove the last item if the length exceeds the maxItems limit
if length > maxItems then
    redis.call('RPOP', chatMessagesKey)
    length = length - 1
end

return length
`;

//===========================================
// handler:
//===========================================
exports.handler = async (event) => {
  // Extract table name from the event records (assuming all records are from the same table)
  const tableName = event.Records[0].eventSourceARN.split(':')[5].split('/')[1];

  for (const record of event.Records) {
    // console.log(`${tableName}: Stream record: ${JSON.stringify(record)}`);

    if (record.eventName === 'INSERT') {
      const newItem = unmarshall(record.dynamodb.NewImage);
      const chatMessagesKey = `${STACK_NAME}:messages(${newItem.chatId})`;

      // Execute the Lua script to insert the new item and manage the list
      const maxItems = 100; // Set your desired limit
      await redisClient.eval(
        luaScript,
        0,
        chatMessagesKey,
        JSON.stringify({
          id: newItem.id,
          timestamp: new Date(newItem.updatedAt).getTime(),
          content: newItem.content,
          sender: newItem.sender,
          viewed: true,
        }),
        maxItems
      );
    } else if (record.eventName === 'MODIFY' || record.eventName === 'REMOVE') {
      // Invalidate the cache:
      redisClient.del(`${STACK_NAME}:messages(global)`); // modifiedItem.chatId
    }
  }

  return { statusCode: 200, body: 'Successfully processed DynamoDB Stream records' };
};
