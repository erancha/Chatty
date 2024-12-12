const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { collectConnectionsAndUsernames } = require('/opt/connections');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

const AWS_REGION = process.env.APP_AWS_REGION;
const STACK_NAME = process.env.STACK_NAME;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

//===========================================
// $disconnect handler:
//===========================================
exports.handler = async (event) => {
  const currentConnectionId = event.requestContext.connectionId;

  try {
    // Refer to the comments inside the lua script:
    const luaScript = `
local currentConnectionId = KEYS[1]
local STACK_NAME = KEYS[2]

-- Retrieve the chat ID associated with the current connection ID
local currentChatId = redis.call('GET', STACK_NAME .. ':chatId(' .. currentConnectionId .. ')')
if currentChatId then
    -- Remove the mapping from currentConnectionId to userId, userName and chatId
    redis.call('DEL', STACK_NAME .. ':userId(' .. currentConnectionId .. ')')
    redis.call('DEL', STACK_NAME .. ':userName(' .. currentConnectionId .. ')')
    redis.call('DEL', STACK_NAME .. ':chatId(' .. currentConnectionId .. ')')

    -- Remove the connection ID from the chat's connections set, and return the updated set
    redis.call('SREM', STACK_NAME .. ':connections(' .. currentChatId .. ')', currentConnectionId)
    return redis.call('SMEMBERS', STACK_NAME .. ':connections(' .. currentChatId .. ')')
else
    return nil  -- No user found for connection ID
end
        `;
    const updatedConnectionIds = await redisClient.eval(luaScript, 2, currentConnectionId, STACK_NAME);
    if (updatedConnectionIds) {
      const messageBody = JSON.stringify({
        targetConnectionIds: updatedConnectionIds,
        message: { connections: await collectConnectionsAndUsernames(redisClient, STACK_NAME, updatedConnectionIds) },
        skipSavingToDB: true,
      });
      const sqsClient = new SQSClient({ region: AWS_REGION });
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: SQS_QUEUE_URL,
          MessageGroupId: 'Default', // Required for FIFO queues
          MessageBody: messageBody,
        })
      );
    } else console.warn(`No users found for connection ID: '${currentConnectionId}' , STACK_NAME: ${STACK_NAME}`);
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }

  return { statusCode: 200 };
};
