const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

exports.handler = async (event) => {
  // console.log(JSON.stringify(event, null, 2));
  const currentConnectionId = event.requestContext.connectionId;
  const { message } = JSON.parse(event.body).data;

  const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);
  const stackName = process.env.STACK_NAME;

  // Lua script
  const luaScript = `
local stackName = ARGV[1]
local connectionId = ARGV[2]

-- Retrieve the userId, userName and chatId of the current connection id:
local userId   = redis.call('GET', stackName .. ':userId:' .. connectionId)
local userName = redis.call('GET', stackName .. ':userName:' .. connectionId)
local chatId   = redis.call('GET', stackName .. ':chatId:' .. connectionId)

-- Return the updated chat's connections set:
local connectionIds = redis.call('SMEMBERS', stackName .. ':connections:' .. chatId)
return {userName, connectionIds}
`;

  // Execute the Lua script and extract username and connection IDs from the response
  const response = await redisClient.eval(luaScript, 0, stackName, currentConnectionId);
  let username;
  let connectionIds;
  if (response) {
    username = response[0];
    connectionIds = response[1];
    // console.log(`User: ${username}, Connection IDs: ${connectionIds}`);
  } else {
    console.warn('No user found for the given connection ID.');
  }

  const sqsClient = new SQSClient({ region: process.env.APP_AWS_REGION });
  const sqsParams = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageGroupId: 'Default', // Required for FIFO queues
  };

  for (const connectionId of connectionIds) {
    try {
      sqsParams.MessageBody = JSON.stringify({ connectionId, message: { content: message, fromUsername: username } });
      console.log(`Inserting a message to the queue: ${sqsParams.MessageBody}`);
      await sqsClient.send(new SendMessageCommand(sqsParams));
    } catch (error) {
      console.error(error);
    }
  }

  try {
    return { statusCode: 200 };
  } catch (error) {
    console.error('Error sending a message:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
