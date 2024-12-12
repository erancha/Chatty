const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const WEBSOCKET_API_URL = process.env.WEBSOCKET_API_URL.replace(/^wss/, 'https');
const MESSAGES_TABLE_NAME = process.env.MESSAGES_TABLE_NAME;

//======================================================================================================
// Handler:
//   1. Extracts messages from an SQS queue.
//   2. Sends the extracted messages to WebSocket clients, on connection ids extracted from the message.
//   3. Writes the messages to a dynamo db table. //TODO: This functionality is planned to be isolated to another lambda function, which will subscribe to a new SNS topic (refer to the readme.md file).
//======================================================================================================
exports.handler = async (event) => {
  try {
    const appGatewayClient = new ApiGatewayManagementApiClient({
      apiVersion: '2018-11-29',
      endpoint: WEBSOCKET_API_URL.replace(/^wss/, 'https'),
    });

    const recordsExtractedFromQueue = event.Records;
    await Promise.all(
      recordsExtractedFromQueue.map(async (record) => {
        const extractedRecord = JSON.parse(record.body);
        console.log(`Extracted record: ${JSON.stringify(extractedRecord)}`);

        // Send the message to all connected clients excluding the sender:
        for (const connectionId of extractedRecord.targetConnectionIds) {
          if (connectionId !== extractedRecord.senderConnectionId) {
            try {
              const jsonMessage = JSON.stringify(extractedRecord.message);
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
        if (!extractedRecord.skipSavingToDB) {
          //TODO: This functionality is planned to be isolated to another lambda function, which will subscribe to a new SNS topic (refer to the readme.md file).
          if (extractedRecord.message.delete) {
            await docClient.send(
              new DeleteCommand({
                TableName: MESSAGES_TABLE_NAME,
                Key: { id: extractedRecord.message.delete },
              })
            );
          } else
            await docClient.send(
              new PutCommand({
                TableName: MESSAGES_TABLE_NAME,
                Item: {
                  chatId: extractedRecord.chatId,
                  updatedAt: new Date().toISOString(),
                  ...extractedRecord.message,
                },
              })
            );
        }
      })
    );
  } catch (error) {
    console.error(`Error: ${error}, event: ${JSON.stringify(event, null, 2)}`);
  }
};
