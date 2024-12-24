const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const WEBSOCKET_API_URL = process.env.WEBSOCKET_API_URL.replace(/^wss/, 'https');

//======================================================================================================
// Handler:
//   1. Extracts messages from an SQS queue.
//   2. Sends the extracted messages to WebSocket clients, on connection ids extracted from the message.
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
        console.log(`Extracted record: ${JSON.stringify(extractedRecord).substring(0, 500)}`);

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
              //TODO: There're occasional GoneException, more often when sending connections+usernames from the $connect handler. I suspect that sometimes a new connection isn't yet fully registered when it's being used for the first time, since often the next message on the same connection IS successfully sent.
              console.warn(error.name, `connectionId: ${connectionId}.`);
            }
          }
        }
      })
    );
  } catch (error) {
    console.error(`Error: ${error}, event: ${JSON.stringify(event, null, 2)}`);
  }
};
