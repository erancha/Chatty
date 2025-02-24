const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);
const dynamodbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const AWS_REGION = process.env.APP_AWS_REGION;
const STACK_NAME = process.env.STACK_NAME;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const MESSAGES_TABLE_NAME = process.env.MESSAGES_TABLE_NAME;

//======================================================================================================
// 1. Receive one message from a connected websocket client.
// 2. Get required data from redis using the sender's connectionId (event.requestContext.connectionId).
// 3. Insert the prepared message into a queue.
//======================================================================================================
exports.handler = async (event) => {
  let statusCode = 200;
  try {
    const CHAT_ID = 'global';
    let chatConnectionIds,
      senderConnectionId,
      chatId = CHAT_ID,
      sender,
      incomingData = {};

    if (event.source === 'banking-service') {
      sender = event.source;
      // console.log(JSON.stringify(event, null, 2));

      chatConnectionIds = await redisClient.smembers(`${STACK_NAME}:connections(${CHAT_ID})`);
      const rawMessage = event.detail.dataCreated.transactions;
      incomingData = {
        messageId: uuidv4(),
        messageContent: `**${rawMessage.amount}$** were **transferred from** account **${rawMessage.accounts.withdrawResult.account_id}** (user *${rawMessage.accounts.withdrawResult.user_id}*) **to** account **${rawMessage.accounts.depositResult.account_id}** (user *${rawMessage.accounts.depositResult.user_id}*)`,
      };
      // }
    } else {
      senderConnectionId = event.requestContext.connectionId;
      incomingData = JSON.parse(event.body).data;
    }

    let sqsMessageBody;
    if (incomingData.messageId) {
      const { messageId, messageContent } = incomingData;
      //====================
      // add a message:
      //====================
      if (!messageContent) throw `messageContent missing in ${event.body}`;

      if (!chatConnectionIds) {
        // Execute the Lua script to get the username, chat id and target connection ids:
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
        const response = await redisClient.eval(luaScript, 0, senderConnectionId, STACK_NAME);
        sender = response[0];
        chatId = response[1];
        chatConnectionIds = response[2];
      }

      // database:
      const dbRecord = { id: messageId, content: messageContent, sender };
      await dynamodbDocClient.send(
        new PutCommand({
          TableName: MESSAGES_TABLE_NAME,
          Item: {
            chatId,
            ...dbRecord,
            updatedAt: new Date().toISOString(),
          },
        })
      );

      // websocket message (thru SQS):
      sqsMessageBody = JSON.stringify({
        targetConnectionIds: chatConnectionIds,
        senderConnectionId,
        message: dbRecord,
      });
    } else if (incomingData.delete) {
      //====================
      // deleting a message:
      //====================
      const { delete: messageId } = incomingData;

      // database:
      await dynamodbDocClient.send(
        new DeleteCommand({
          TableName: MESSAGES_TABLE_NAME,
          Key: { id: messageId },
        })
      );

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

      // websocket message (thru SQS):
      sqsMessageBody = JSON.stringify({
        targetConnectionIds: chatConnectionIds,
        senderConnectionId,
        chatId,
        message: { delete: messageId },
      });
    } else if (incomingData.ping) {
      //========================
      // ping:
      //========================
      sqsMessageBody = JSON.stringify({
        targetConnectionIds: [senderConnectionId],
        message: { ping: new Date().toISOString() /* to prevent de-duplication in SQS */ },
      });
    } else console.warn(`Received unexpected command: ${JSON.stringify(incomingData, null, 2)}`);

    let statusCode = 200;
    if (sqsMessageBody) {
      console.log(`Inserting a message to the queue: ${sqsMessageBody.length} bytes, ${sqsMessageBody.substring(0, 500)} ...`);
      const sqsClient = new SQSClient({ region: AWS_REGION });
      const sqsParams = {
        QueueUrl: SQS_QUEUE_URL,
        MessageGroupId: 'Default', // Required for FIFO queues
        MessageBody: sqsMessageBody,
      };

      try {
        await sqsClient.send(new SendMessageCommand(sqsParams));
      } catch (error) {
        console.error(`Error sending SQS for connectionId '${senderConnectionId}': ${error} : ${sqsMessageBody}`);
      }
    } else {
      statusCode = 400; // bad request
    }
  } catch (error) {
    console.error(`Error processing event ${JSON.stringify(event, null, 2)} : ${error}`);
    statusCode = 500; // internal server error
  }

  return { statusCode };
};
