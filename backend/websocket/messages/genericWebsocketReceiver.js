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

  let sqsMessageBody;
  if (incomingData.messageId) {
    //====================
    // adding a message:
    //====================
    if (!incomingData.messageContent) throw `messageContent missing in ${event.body}`;
    // Lua script
    const luaScript = `
local senderConnectionId = ARGV[1]
local STACK_NAME = ARGV[2]

-- Retrieve the userName and chatId of senderConnectionId:
local userName = redis.call('GET', STACK_NAME .. ':userName(' .. senderConnectionId .. ')')
local chatId   = redis.call('GET', STACK_NAME .. ':chatId(' .. senderConnectionId .. ')')

-- Retrieve the chat's connection ids:
local chatConnectionIds = redis.call('SMEMBERS', STACK_NAME .. ':connections(' .. chatId .. ')')
return {userName, chatId, chatConnectionIds}
`;

    // Execute the Lua script to get the username, chat id and target connection ids:
    const response = await redisClient.eval(luaScript, 0, senderConnectionId, STACK_NAME);
    let sender, chatId, chatConnectionIds;
    sender = response[0];
    chatId = response[1];
    chatConnectionIds = response[2];
    sqsMessageBody = JSON.stringify({
      targetConnectionIds: chatConnectionIds,
      senderConnectionId,
      chatId,
      message: { id: incomingData.messageId, content: incomingData.messageContent, sender },
    });
  } else if (incomingData.delete) {
    //====================
    // deleting a message:
    //====================
    // Refer to the comments inside the lua script:
    const luaScript = `
local senderConnectionId = ARGV[1]
local STACK_NAME = ARGV[2]

-- Retrieve the chatId of senderConnectionId:
local chatId = redis.call('GET', STACK_NAME .. ':chatId(' .. senderConnectionId .. ')')

-- Retrieve the chat's connection ids:
local chatConnectionIds = redis.call('SMEMBERS', STACK_NAME .. ':connections(' .. chatId .. ')')
return {chatId, chatConnectionIds}
        `;
    const response = await redisClient.eval(luaScript, 0, senderConnectionId, STACK_NAME);
    let chatId, chatConnectionIds;
    chatId = response[0];
    chatConnectionIds = response[1];
    sqsMessageBody = JSON.stringify({ targetConnectionIds: chatConnectionIds, senderConnectionId, chatId, message: { delete: incomingData.delete } }); // delete message id
  } else if (incomingData.ping) {
    //========================
    // ping from the frontend - the backend responds with the timestamp (only to avoid de-duplication in SQS - the frontend doesn't use this value)
    //========================
    sqsMessageBody = JSON.stringify({ targetConnectionIds: [senderConnectionId], message: { ping: new Date().toISOString() }, skipSavingToDB: true });
  }

  let statusCode = 200;
  if (sqsMessageBody) {
    // Insert a record to the SQS queue:
    const sqsClient = new SQSClient({ region: AWS_REGION });
    const sqsParams = {
      QueueUrl: SQS_QUEUE_URL,
      MessageGroupId: 'Default', // Required for FIFO queues
      MessageBody: sqsMessageBody,
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
