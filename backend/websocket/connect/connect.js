const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { collectConnectionsAndUsernames } = require('/opt/connections');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);
const STACK_NAME = process.env.STACK_NAME;
const AWS_REGION = process.env.APP_AWS_REGION;
const MESSAGES_TABLE_NAME = process.env.MESSAGES_TABLE_NAME;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

//===========================================
// $connect handler:
//===========================================
exports.handler = async (event) => {
  // console.log(JSON.stringify(event, null, 3));

  // Extract JWT token and chatId from the query string:
  let currentJwtToken, currentChatId;
  if (event.queryStringParameters && event.queryStringParameters.token) {
    currentJwtToken = event.queryStringParameters.token;
    currentChatId = event.queryStringParameters.chatId;
    if (!currentChatId)
      console.warn(
        `'chatId' not found in the query string: ${JSON.stringify(event, null, 2)} , decoded token: ${JSON.stringify(
          jwt.decode(currentJwtToken),
          null,
          2
        )}`
      );
  } else throw new Error('JWT token is missing in the query string');
  const decodedToken = jwt.decode(currentJwtToken);
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
local currentChatId = KEYS[4]
local STACK_NAME = ARGV[1]
local EXPIRATION_TIME = tonumber(ARGV[2])

-- Store the user ID, user name, and chat ID for the connection ID with expiration
redis.call('set', STACK_NAME .. ':userId(' .. currentConnectionId .. ')', currentUserId, 'EX', EXPIRATION_TIME)
redis.call('set', STACK_NAME .. ':userName(' .. currentConnectionId .. ')', currentUserName, 'EX', EXPIRATION_TIME)
redis.call('set', STACK_NAME .. ':chatId(' .. currentConnectionId .. ')', currentChatId, 'EX', EXPIRATION_TIME)

-- Add the connection ID to the chat's connections set and set expiration
redis.call('sadd', STACK_NAME .. ':connections(' .. currentChatId .. ')', currentConnectionId)
redis.call('expire', STACK_NAME .. ':connections(' .. currentChatId .. ')', EXPIRATION_TIME)

-- Return all connection IDs for the chat
return redis.call('smembers', STACK_NAME .. ':connections(' .. currentChatId .. ')')
`;

  try {
    // Refer to the comments inside the lua script:
    const EXPIRATION_TIME = 12 * 60 * 60; // === 12 hours
    const connectionIds = await redisClient.eval(
      luaScript,
      4,
      currentConnectionId,
      currentUserId,
      currentUserName,
      currentChatId,
      STACK_NAME,
      EXPIRATION_TIME
    );
    console.log(JSON.stringify({ currentConnectionId, connectionIds, currentUserName, currentUserId }));

    // Load and send the previous chat messages to the client:
    const connections = await collectConnectionsAndUsernames(redisClient, STACK_NAME, connectionIds);
    const previousMessages = await loadPreviousChatMessages(currentChatId, currentUserName);
    const sqsClient = new SQSClient({ region: AWS_REGION });
    const sqsParams = {
      QueueUrl: SQS_QUEUE_URL,
      MessageGroupId: 'Default', // Required for FIFO queues
      MessageBody: JSON.stringify({
        targetConnectionIds: [currentConnectionId],
        chatId: currentChatId,
        message: {
          connections,
          previousMessages,
        },
        skipSavingToDB: true,
      }),
    };

    await sqsClient.send(new SendMessageCommand(sqsParams));

    return { statusCode: 200 };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

//================================================================
// Load previous chat messages:
//================================================================
const dynamodbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function loadPreviousChatMessages(currentChatId, currentUserName) {
  const startTime = Date.now();

  // Try loading the previous chat messages from Redis:
  const chatMessagesKey = `${STACK_NAME}:messages(${currentChatId})`;
  let previousChatMessages = await redisClient.lrange(chatMessagesKey, 0, -1);
  if (previousChatMessages.length > 0) {
    previousChatMessages = previousChatMessages.map((message) => JSON.parse(message));
  } else {
    // Load the previous chat messages from DynamoDB:
    const result = await dynamodbDocClient.send(
      new QueryCommand({
        TableName: MESSAGES_TABLE_NAME,
        IndexName: 'ChatIdUpdatedIndex',
        KeyConditionExpression: 'chatId = :chatId',
        ExpressionAttributeValues: { ':chatId': currentChatId },
        Select: 'ALL_ATTRIBUTES',
        ScanIndexForward: false,
        Limit: 100, //TODO: Handle pagination.
      })
    );
    previousChatMessages = await result.Items.map((item) => {
      return {
        id: item.id,
        timestamp: new Date(item.updatedAt).getTime(),
        content: item.content,
        sender: item.sender,
        viewed: true,
      };
    });

    // Insert the previous chat messages into Redis:
    const previousMessagesStringifiedItems = previousChatMessages.map((message) => JSON.stringify(message));
    await redisClient.rpush(chatMessagesKey, ...previousMessagesStringifiedItems);

    // Example of removing the last item and inserting a new item at the beginning
    // const newMessage = { /* your new message object */ }; // Define your new message here
    // await redisClient.rpop(redisKey); // Remove the last item
    // await redisClient.lpush(redisKey, JSON.stringify(newMessage)); // Insert the new item at the beginning
  }

  // Nullify the sender attribute for records with the same sender as the current username (as done for new messages by the current user):
  previousChatMessages = previousChatMessages.map((message) => {
    // console.log(message, currentUserName);
    return {
      ...message,
      sender: message.sender !== currentUserName ? message.sender : null,
    };
  });

  const elapsedTime = Date.now() - startTime;
  // console.log(`loadPreviousChatMessages -> ${previousChatMessages.length} items, elapsed time: ${elapsedTime} ms`);

  return previousChatMessages;
}
