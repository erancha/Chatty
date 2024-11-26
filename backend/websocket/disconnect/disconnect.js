const Redis = require('ioredis');

const redisClient = new Redis(process.env.ELASTICACHE_REDIS_ADDRESS);

exports.handler = async (event) => {
  const currentConnectionId = event.requestContext.connectionId;

  try {
    // Refer to the comments inside the lua script:
    const luaScript = `
local currentConnectionId = KEYS[1]
local stackName = KEYS[2]

-- Retrieve the current user ID associated with the current connection ID
local currentUserId = redis.call('GET', stackName .. ':userId:' .. currentConnectionId)

if currentUserId then
    -- Retrieve the chatId of the current connection id
    local chatId = redis.call('GET', stackName .. ':chatId:' .. currentConnectionId)

    -- Remove the mapping from currentConnectionId to userId, userName and chatId
    redis.call('DEL', stackName .. ':userId:' .. currentConnectionId)
    redis.call('DEL', stackName .. ':userName:' .. currentConnectionId)
    redis.call('DEL', stackName .. ':chatId:' .. currentConnectionId)

    -- Remove the connection ID from the chat's connections set, and return the updated set
    redis.call('SREM', stackName .. ':connections:' .. chatId, currentConnectionId)
    return redis.call('SMEMBERS', stackName .. ':connections:' .. chatId)
else
    return nil  -- No user found for connection ID
end
        `;
    const updatedConnectionIds = await redisClient.eval(luaScript, 2, currentConnectionId, process.env.STACK_NAME);
    if (updatedConnectionIds) console.log(JSON.stringify({ currentConnectionId, updatedConnectionIds }));
    else console.warn(`No user found for connection ID: ${currentConnectionId}`);
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }

  return { statusCode: 200 };
};
