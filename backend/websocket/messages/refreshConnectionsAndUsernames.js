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
const CHAT_ID = 'global';

//===========================================
// handler:
//===========================================
exports.handler = async (event) => {
  try {
    const targetConnectionIds = await redisClient.smembers(`${STACK_NAME}:connections(${CHAT_ID})`);
    const sqsClient = new SQSClient({ region: AWS_REGION });

    // Send all current connections and usernames to all connected users every few minutes (ScheduleExpression: cron(0/5 * * * ? *)):
    if (targetConnectionIds.length > 0) {
      // console.log({ targetConnectionIds });
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: SQS_QUEUE_URL,
          MessageGroupId: 'Default', // Required for FIFO queues
          MessageBody: JSON.stringify({
            targetConnectionIds,
            chatId: CHAT_ID,
            message: { connections: await collectConnectionsAndUsernames(redisClient, STACK_NAME, targetConnectionIds) },
            skipSavingToDB: true,
          }),
        })
      );
    }

    // Randomize a message every 1 hour:
    /*if (new Date().getMinutes() === 0)TODO!!*/ {
      const record = await getRecordAroundRandomTimestamp('2024-11-29T15:25:12.088Z', '2024-11-29T15:25:15.076Z');
      // console.log(JSON.stringify(record.content));
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: SQS_QUEUE_URL,
          MessageGroupId: 'Default', // Required for FIFO queues
          MessageBody: JSON.stringify({
            targetConnectionIds,
            chatId: CHAT_ID,
            message: { id: record.id, content: record.content, sender: `${STACK_NAME} : AWS::Events::Rule cron` },
          }),
        })
      );
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

const dynamodbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

//================================================================
// Function to get a record around a randomly generated timestamp
//================================================================
async function getRecordAroundRandomTimestamp(startTimestamp, endTimestamp) {
  const start = new Date(startTimestamp).getTime();
  const end = new Date(endTimestamp).getTime();
  const randomTime = start + Math.floor(Math.random() * (end - start + 1));
  const randomTimestamp = new Date(randomTime).toISOString();

  try {
    const result = await dynamodbDocClient.send(
      new QueryCommand({
        TableName: MESSAGES_TABLE_NAME,
        IndexName: 'ChatIdUpdatedIndex',
        KeyConditionExpression: 'chatId = :chatId AND updatedAt BETWEEN :start AND :random',
        ExpressionAttributeValues: {
          ':chatId': CHAT_ID,
          ':start': new Date(startTimestamp).toISOString(),
          ':random': randomTimestamp,
        },
        Limit: 1,
        ScanIndexForward: false,
      })
    );

    const items = result.Items || [];

    // Throw an error if no records were found
    if (items.length === 0) {
      throw new Error(`No records found for the specified time range: ${startTimestamp} to ${randomTimestamp}`);
    }

    return items[0];
  } catch (error) {
    console.error('Error getting record from DynamoDB:', error);
    throw error; // Re-throw the error to propagate it upwards
  }
}
