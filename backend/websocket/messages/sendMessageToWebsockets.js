const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/*
This handler:
  1. Extracts messages from an SQS queue.
  2. Sends the extracted messages to WebSocket clients, on connection ids extracted from the message.
  3. Writes the messages to a dynamo db table. //TODO: This functionality is planned to be isolated to another lambda function, which will subscribe to a new SNS topic (refer to the readme.md file).
*/
exports.handler = async (event) => {
  // console.log(JSON.stringify(event, null, 2));

  try {
    const appGatewayClient = new ApiGatewayManagementApiClient({
      apiVersion: '2018-11-29',
      endpoint: process.env.WEBSOCKET_API_URL.replace(/^wss/, 'https'),
    });

    const recordsExtractedFromQueue = event.Records;
    await Promise.all(
      recordsExtractedFromQueue.map(async (record) => {
        const extractedRecord = JSON.parse(record.body);

        // Send the message to all connected clients excluding the sender:
        for (const connectionId of extractedRecord.targetConnectionIds) {
          if (connectionId !== extractedRecord.senderConnectionId) {
            try {
              const jsonMessage = JSON.stringify(extractedRecord.message);
              console.log(`Sending a message on connection: '${connectionId}' : ${jsonMessage}`);
              await appGatewayClient.send(
                new PostToConnectionCommand({
                  ConnectionId: connectionId,
                  Data: Buffer.from(jsonMessage),
                })
              );
            } catch (error) {
              console.warn(error.name, `connectionId: ${connectionId}.`);
            }
          }
        }

        // Write each message to a dynamo db table:
        const messageId = crypto.randomUUID();
        const currentTimestamp = new Date().toISOString();
        await docClient.send(
          new PutCommand({
            TableName: process.env.MESSAGES_TABLE_NAME,
            Item: {
              id: messageId,
              chatId: extractedRecord.chatId,
              updatedAt: currentTimestamp,
              ...extractedRecord.message,
            },
          })
        );
      })
    );
  } catch (error) {
    console.error(`Error receiving messages: ${error}, event: ${JSON.stringify(event, null, 2)}`);
  }
};
