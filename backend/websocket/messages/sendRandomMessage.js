const Redis = require('ioredis');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { collectConnectionsAndUsernames } = require('/opt/connections');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

const STACK_NAME = process.env.STACK_NAME;
const CHAT_ID = 'global';

//===========================================
// handler:
//===========================================
exports.handler = async (event) => {
  try {
    const targetConnectionIds = await redisClient.smembers(`${STACK_NAME}:connections(${CHAT_ID})`);
    console.log({ targetConnectionIds });
    if (targetConnectionIds.length > 0) {
      let message,
        skipSavingToDB = false;
      if (new Date().getMinutes() === 0) {
        const record = await getRecordAroundRandomTimestamp('2024-11-29T15:25:10.631Z', '2024-11-29T15:25:15.076Z');
        // console.log('Record Around Random Timestamp:', record);
        message = { content: record.content, sender: `${STACK_NAME} : AWS::Events::Rule cron(* 8-23 * * ? *) ${new Date().getMinutes()}` };
      } else {
        message = { connections: await collectConnectionsAndUsernames(redisClient, STACK_NAME, targetConnectionIds) };
        skipSavingToDB = true;
      }

      const sqsClient = new SQSClient({ region: process.env.APP_AWS_REGION });
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: process.env.SQS_QUEUE_URL,
          MessageGroupId: 'Default', // Required for FIFO queues
          MessageBody: JSON.stringify({
            targetConnectionIds,
            chatId: CHAT_ID,
            message,
            skipSavingToDB,
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
  const randomTime = Math.floor(Math.random() * (end - start + 1)) + start;
  const randomTimestamp = new Date(randomTime).toISOString(); // Return in ISO format

  try {
    const result = await dynamodbDocClient.send(
      new QueryCommand({
        TableName: process.env.MESSAGES_TABLE_NAME,
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
    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error('Error getting record from DynamoDB:', error);
  }
}
