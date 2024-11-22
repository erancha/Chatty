const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

exports.handler = async (event) => {
  const currentConnectionId = event.requestContext.connectionId;
  const { message } = JSON.parse(event.body).data;

  const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);
  const stackName = process.env.STACK_NAME;

  // Load the updated Lua script
  const luaScript = `
    local stackName = ARGV[1]
    local connectionId = ARGV[2]

    local userId = redis.call('GET', stackName .. ':users:' .. connectionId)

    if not userId then
        return nil
    end

    local connectionIds = redis.call('SMEMBERS', stackName .. ':connections:' .. userId)

    return connectionIds
  `;

  // Execute the Lua script
  const connectionIds = await redisClient.eval(luaScript, 0, stackName, currentConnectionId);

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
