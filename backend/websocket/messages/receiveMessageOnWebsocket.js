const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

const AWS_REGION = process.env.APP_AWS_REGION;
const STACK_NAME = process.env.STACK_NAME;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

//======================================================================================================
// 1. Receive one message from a connected websocket client.
// 2. Get required data from redis using the sender's connectionId (event.requestContext.connectionId).
// 3. Insert the prepared message into a queue.
//======================================================================================================
exports.handler = async (event) => {
  const senderConnectionId = event.requestContext.connectionId;
  const incomingData = JSON.parse(event.body).data;

  let messageBody;
  if (incomingData.message) {
    // Lua script
    const luaScript = `
local STACK_NAME = ARGV[1]
local senderConnectionId = ARGV[2]

-- Retrieve the userName and chatId of senderConnectionId:
local userName = redis.call('GET', STACK_NAME .. ':userName(' .. senderConnectionId .. ')')
local chatId   = redis.call('GET', STACK_NAME .. ':chatId(' .. senderConnectionId .. ')')

-- Return the chat's connection ids:
local chatConnectionIds = redis.call('SMEMBERS', STACK_NAME .. ':connections(' .. chatId .. ')')
return {userName, chatId, chatConnectionIds}
`;

    // Execute the Lua script to get the username, chat id and target connection ids:
    const response = await redisClient.eval(luaScript, 0, STACK_NAME, senderConnectionId);
    let sender, chatId, targetConnectionIds;
    if (response) {
      sender = response[0];
      chatId = response[1];
      targetConnectionIds = response[2];
      messageBody = JSON.stringify({ targetConnectionIds, senderConnectionId, chatId, message: { content: incomingData.message, sender } });
    } else {
      console.error(`No user found for connection ID '${senderConnectionId}'`);
    }
  } else if (incomingData.ping) {
    messageBody = JSON.stringify({ targetConnectionIds: [senderConnectionId], message: { ping: new Date().toISOString() }, skipSavingToDB: true });
  }

  let statusCode = 200;
  if (messageBody) {
    // Insert a record to the SQS queue:
    const sqsClient = new SQSClient({ region: AWS_REGION });
    const sqsParams = {
      QueueUrl: SQS_QUEUE_URL,
      MessageGroupId: 'Default', // Required for FIFO queues
      MessageBody: messageBody,
    };

    try {
      // console.log(`Inserting a message to the queue: ${sqsParams.MessageBody}`);
      await sqsClient.send(new SendMessageCommand(sqsParams));
    } catch (error) {
      console.error(`Error sending SQS for connectionId '${senderConnectionId}':`, error);
    }
  } else {
    statusCode = 400; // bad request
  }

  return { statusCode };
};
