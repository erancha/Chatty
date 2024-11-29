const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

exports.handler = async (event) => {
  // Extract JWT token and chatId from the query string:
  let token, chatId;
  if (event.queryStringParameters && event.queryStringParameters.token) {
    token = event.queryStringParameters.token;
    chatId = event.queryStringParameters.chatId;
    if (!chatId)
      console.warn(
        `'chatId' not found in the query string: ${JSON.stringify(event, null, 2)} , decoded token: ${JSON.stringify(jwt.decode(token), null, 2)}`
      );
  } else throw new Error('JWT token is missing in the query string');
  const decodedToken = jwt.decode(token);
  if (!decodedToken || !decodedToken.sub) throw new Error('Invalid token: Missing user id (sub)');

  // Extract user id (sub) and user name from the token
  // console.log(JSON.stringify(decodedToken, null, 3));
  const currentConnectionId = event.requestContext.connectionId;
  const currentUserId = decodedToken.sub;
  const currentUserName = decodedToken.name;

  // Refer to the comments inside the lua script:
  const luaScript = `
local currentConnectionId = KEYS[1]
local currentUserId = KEYS[2]
local currentUserName = KEYS[3]
local chatId = KEYS[4]
local stackName = ARGV[1]

-- Store the user ID, user name and chat Id for the connection ID:
redis.call('set', stackName .. ':userId(' .. currentConnectionId .. ')', currentUserId)
redis.call('set', stackName .. ':userName(' .. currentConnectionId .. ')', currentUserName)
redis.call('set', stackName .. ':chatId(' .. currentConnectionId .. ')', chatId)

-- Add the connection ID to the chat's connections set
redis.call('sadd', stackName .. ':connections(' .. chatId .. ')', currentConnectionId)

-- Return all connection IDs for the chat
return redis.call('smembers', stackName .. ':connections(' .. chatId .. ')')
`;

  try {
    // Refer to the comments inside the lua script:
    const stackName = process.env.STACK_NAME;
    const connectionIds = await redisClient.eval(luaScript, 4, currentConnectionId, currentUserId, currentUserName, chatId, stackName);
    console.log(JSON.stringify({ currentConnectionId, connectionIds }));

    // Load and send to the client previous chat messages from DynamoDB:
    const sqsClient = new SQSClient({ region: process.env.APP_AWS_REGION });
    const sqsParams = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageGroupId: 'Default', // Required for FIFO queues
    };
    sqsParams.MessageBody = JSON.stringify({
      targetConnectionIds: [currentConnectionId],
      chatId,
      message: { previousMessages: await loadPreviousMessages(chatId) },
      skipSavingToDB: true,
    });
    await sqsClient.send(new SendMessageCommand(sqsParams));

    if (decodedToken.sub === '23743842-4061-709b-44f8-4ef9a527509d') {
      for (const connectionId of connectionIds) {
        try {
          const username = await redisClient.get(`${stackName}:userName(${connectionId})`);
          sqsParams.MessageBody = JSON.stringify({
            targetConnectionIds: [currentConnectionId],
            chatId,
            message: { content: `connectionId: '${connectionId}' <===> User: ${username}`, sender: '$connect' },
            skipSavingToDB: true,
          });
          await sqsClient.send(new SendMessageCommand(sqsParams));
        } catch (error) {
          console.error(`Error sending SQS for connectionId '${connectionId}':`, error);
        }
      }
    } else {
      let content = 'Connected users:\n';
      for (const connectionId of connectionIds) {
        try {
          const username = await redisClient.get(`${stackName}:userName(${connectionId})`);
          content += `  - ${username}\n`;
        } catch (error) {
          console.error(`Error reading username for connection: '${connectionId}'.`, error);
        }
      }

      try {
        sqsParams.MessageBody = JSON.stringify({
          targetConnectionIds: [currentConnectionId],
          chatId,
          message: { content, sender: '$connect' },
          skipSavingToDB: true,
        });
        await sqsClient.send(new SendMessageCommand(sqsParams));
      } catch (error) {
        console.error(`Error sending SQS for connectionId '${currentConnectionId}'.`, error);
      }
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error('Error executing Lua script for $connect handler:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

const dynamodbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Load previous chat messages from DynamoDB:
async function loadPreviousMessages(currentChatId) {
  const result = await dynamodbDocClient.send(
    new QueryCommand({
      TableName: process.env.MESSAGES_TABLE_NAME,
      IndexName: 'ChatIdUpdatedIndex',
      KeyConditionExpression: 'chatId = :chatId',
      ExpressionAttributeValues: { ':chatId': currentChatId },
      Select: 'ALL_ATTRIBUTES',
      ScanIndexForward: false,
      Limit: 50, //TODO: Handle pagination.
    })
  );
  const messages = await result.Items.map((item) => {
    return {
      id: item.id,
      timestamp: new Date(item.updatedAt).getTime(),
      content: item.content,
      sender: item.sender,
      viewed: true,
    };
  });

  return messages;
}
