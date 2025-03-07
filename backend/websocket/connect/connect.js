const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { collectConnectionsAndUsernames } = require('/opt/connections');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

const AWS_REGION = process.env.APP_AWS_REGION;
const STACK_NAME = process.env.STACK_NAME;
const MESSAGES_TABLE_NAME = process.env.MESSAGES_TABLE_NAME;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

//===========================================
// $connect handler:
//===========================================
exports.handler = async (event) => {
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
  const decodedJwt = jwt.decode(currentJwtToken);
  if (!decodedJwt || !decodedJwt.sub) throw new Error('Invalid token: Missing user id (sub)');

  // Extract user id (sub) and user name from the token
  const currentConnectionId = event.requestContext.connectionId;
  const currentUserId = decodedJwt.sub;
  const currentUserName = decodedJwt.name;

  // Refer to the comments inside the lua script:
  const luaScript = `
local currentConnectionId = KEYS[1]
local currentUserId = KEYS[2]
local currentUserName = KEYS[3]
local currentChatId = KEYS[4]
local STACK_NAME = ARGV[1]
local EXPIRATION_TIME = tonumber(ARGV[2])

-- Store the user ID, user name, and chat ID for the connection ID, with expiration
redis.call('set', STACK_NAME .. ':userId(' .. currentConnectionId .. ')', currentUserId, 'EX', EXPIRATION_TIME)
redis.call('set', STACK_NAME .. ':userName(' .. currentConnectionId .. ')', currentUserName, 'EX', EXPIRATION_TIME)
redis.call('set', STACK_NAME .. ':chatId(' .. currentConnectionId .. ')', currentChatId, 'EX', EXPIRATION_TIME)

-- Add the connection ID to the chat's connections set, with expiration
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
    const connectionsAndUsernames = await collectConnectionsAndUsernames(redisClient, STACK_NAME, connectionIds);

    // Send all connected usernames (including the current new one) to all connected users excluding the current which will be handled below:
    const sqsClient = new SQSClient({ region: AWS_REGION });
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MessageGroupId: 'Default', // Required for FIFO queues
        MessageBody: JSON.stringify({
          targetConnectionIds: connectionIds,
          senderConnectionId: currentConnectionId,
          message: { connectionsAndUsernames, timeStamp: new Date().toISOString() /* to prevent de-duplication in SQS */ },
        }),
      })
    );

    // Load and send the previous chat messages to the current client:
    const previousMessages = await loadPreviousChatMessages(currentChatId, currentUserName);
    sqsMessageBody = JSON.stringify({
      targetConnectionIds: [currentConnectionId],
      message: { previousMessages, connectionsAndUsernames },
    });
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MessageGroupId: 'Default', // Required for FIFO queues
        MessageBody: sqsMessageBody,
      })
    );

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
    console.log('Cache miss. Loading from the database ..');

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
    previousChatMessages = result.Items.map((item) => ({
      id: item.id,
      timestamp: new Date(item.updatedAt).getTime(),
      content: item.content,
      sender: item.sender,
      viewed: true,
    }));

    // Insert the previous chat messages into Redis:
    const previousMessagesStringifiedItems = previousChatMessages.map((message) => JSON.stringify(message));
    await redisClient.rpush(chatMessagesKey, ...previousMessagesStringifiedItems);
  }

  // Nullify the sender attribute for records with the same sender as the current username (as done for new messages by the current user):
  previousChatMessages = previousChatMessages.map((message) => {
    return {
      ...message,
      sender: message.sender !== currentUserName ? message.sender : null,
    };
  });

  const elapsedTime = Date.now() - startTime;

  return previousChatMessages;
}
