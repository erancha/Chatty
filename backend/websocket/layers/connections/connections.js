//================================================================
// Prepares an array of {connection, username}:
//================================================================
async function collectConnectionsAndUsernames(redisClient, STACK_NAME, connectionIds) {
  let connectionsAndUsernames = [];
  for (const connectionId of connectionIds) {
    try {
      const username = await redisClient.get(`${STACK_NAME}:userName(${connectionId})`);
      connectionsAndUsernames.push({ connectionId, username });
    } catch (error) {
      console.error(`Error reading username for connection: '${connectionId}'.`, error);
    }
  }
  return connectionsAndUsernames;
}

module.exports = { collectConnectionsAndUsernames };
