const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

exports.handler = async (event) => {
  console.log({ event });
  let token;

  // Try to extract the token from the Authorization header (comes after 'Bearer ' in the Authorization header)
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (authHeader) {
    token = authHeader.split(' ')[1];
    if (!token) throw new Error('Token is missing from Authorization header');
  } else {
    // If no Authorization header, check for token in query string parameters
    if (event.queryStringParameters && event.queryStringParameters.token) {
      token = event.queryStringParameters.token;
    } else throw new Error('Authorization header and query string token are missing');
  }
  const decodedToken = jwt.decode(token);
  if (!decodedToken || !decodedToken.sub) {
    throw new Error('Invalid token: Missing user id (sub)');
  }
  const currentUserId = decodedToken.sub; // Extract user id (sub) from the token

  // Send the message to all connected devices of the current user:
  const message = event.queryStringParameters?.message;
  const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);
  const connectionIds = await redisClient.smembers(`connections:${currentUserId}`);

  const sqsClient = new SQSClient({ region: process.env.APP_AWS_REGION });
  const sqsParams = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageGroupId: 'Default', // Required for FIFO queues
  };

  for (const connectionId of connectionIds) {
    try {
      sqsParams.MessageBody = JSON.stringify({ connectionId, message });
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
