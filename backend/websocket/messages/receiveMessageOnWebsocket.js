const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

/*
  1. Receive one message from a connected websocket client.
  2. Get required data from redis using the sender's connectionId (event.requestContext.connectionId).
  3. Insert the prepared message into a queue.
*/
exports.handler = async (event) => {
  // console.log(JSON.stringify(event, null, 2));
  const senderConnectionId = event.requestContext.connectionId;
  const { message } = JSON.parse(event.body).data;

  const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);
  const stackName = process.env.STACK_NAME;

  // Lua script
  const luaScript = `
local stackName = ARGV[1]
local senderConnectionId = ARGV[2]

-- Retrieve the userName and chatId of senderConnectionId:
local userName = redis.call('GET', stackName .. ':userName(' .. senderConnectionId .. ')')
local chatId   = redis.call('GET', stackName .. ':chatId(' .. senderConnectionId .. ')')

-- Return the chat's connection ids:
local chatConnectionIds = redis.call('SMEMBERS', stackName .. ':connections(' .. chatId .. ')')
return {userName, chatId, chatConnectionIds}
`;

  // Execute the Lua script to get the username, chat id and target connection ids:
  const response = await redisClient.eval(luaScript, 0, stackName, senderConnectionId);
  let sender, chatId, targetConnectionIds;
  if (response) {
    sender = response[0];
    chatId = response[1];
    targetConnectionIds = response[2];
  } else {
    console.warn('No user found for the given connection ID.');
  }

  // Insert a record to the SQS queue:
  const sqsClient = new SQSClient({ region: process.env.APP_AWS_REGION });
  const sqsParams = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageGroupId: 'Default', // Required for FIFO queues
    MessageBody: JSON.stringify({ targetConnectionIds, senderConnectionId, chatId, message: { content: message, sender } }),
  };

  try {
    console.log(`Inserting a message to the queue: ${sqsParams.MessageBody}`);
    await sqsClient.send(new SendMessageCommand(sqsParams));
  } catch (error) {
    console.error(`Error sending SQS for connectionId '${senderConnectionId}':`, error);
  }

  return { statusCode: 200 };
};
