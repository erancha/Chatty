const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

exports.handler = async (event) => {
  // Extract JWT token and chatId from the query string:
  let token, chatId;
  if (event.queryStringParameters && event.queryStringParameters.token) {
    token = event.queryStringParameters.token;
    chatId = event.queryStringParameters.chatId;
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
redis.call('set', stackName .. ':userId:' .. currentConnectionId, currentUserId)
redis.call('set', stackName .. ':userName:' .. currentConnectionId, currentUserName)
redis.call('set', stackName .. ':chatId:' .. currentConnectionId, chatId)

-- Add the connection ID to the chat's connections set
redis.call('sadd', stackName .. ':connections:' .. chatId, currentConnectionId)

-- Return all connection IDs for the chat
return redis.call('smembers', stackName .. ':connections:' .. chatId)
`;

  try {
    const connectionIds = await redisClient.eval(luaScript, 4, currentConnectionId, currentUserId, currentUserName, chatId, process.env.STACK_NAME);
    console.log(JSON.stringify({ currentConnectionId, connectionIds }));

    // dev-test purpose only
    if (/*connectionIds.length > 1 &&*/ decodedToken.email === 'erancha@gmail.com') {
      const sqsClient = new SQSClient({ region: process.env.APP_AWS_REGION });
      const sqsParams = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageGroupId: 'Default', // Required for FIFO queues
      };

      for (const connectionId of connectionIds) {
        try {
          const username = await redisClient.get(`${process.env.STACK_NAME}:userName:${connectionId}`);
          sqsParams.MessageBody = JSON.stringify({
            connectionId: currentConnectionId,
            message: { content: `connectionId: ${connectionId} , User: ${username}`, fromUsername: '$connect' },
          });
          await sqsClient.send(new SendMessageCommand(sqsParams));
        } catch (error) {
          console.error(`Error sending SQS for connectionId ${connectionId}:`, error);
        }
      }
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error('Error executing Lua script for $connect handler:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
