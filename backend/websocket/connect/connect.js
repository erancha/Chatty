const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

exports.handler = async (event) => {
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

  // Extract user id (sub) and user name from the token
  // console.log(JSON.stringify(decodedToken, null, 3));
  const currentConnectionId = event.requestContext.connectionId;
  const currentUserId = decodedToken.sub;
  const currentUserName = decodedToken.name;

  // -- Store the user ID and name for the connection ID
  // -- Add the connection ID to the user's connections set
  // -- Retrieve and return all connection IDs for the user
  const luaScript = `
local currentConnectionId = KEYS[1]
local currentUserId = KEYS[2]
local currentUserName = KEYS[3]
local stackName = ARGV[1]

-- Store the user ID and name for the connection ID
redis.call('set', stackName .. ':userId:' .. currentConnectionId, currentUserId)
redis.call('set', stackName .. ':userName:' .. currentConnectionId, currentUserName)

-- Add the connection ID to the user's connections set
redis.call('sadd', stackName .. ':connections:' .. currentUserId, currentConnectionId)

-- Retrieve and return all connection IDs for the user
return redis.call('smembers', stackName .. ':connections:' .. currentUserId)
`;

  try {
    const connectionIds = await redisClient.eval(luaScript, 3, currentConnectionId, currentUserId, currentUserName, process.env.STACK_NAME);
    console.log(JSON.stringify({ currentConnectionId, connectionIds }));
    return { statusCode: 200 };
  } catch (error) {
    console.error('Error executing Lua script for $connect handler:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
