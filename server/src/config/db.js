const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

// Set reliable DNS servers for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

let memoryServerInstance = null;

// Format URI to auto-encode special characters in password if needed
function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return uri;
  try {
    const protoEnd = uri.indexOf('://');
    if (protoEnd !== -1) {
      const proto = uri.slice(0, protoEnd + 3);
      const afterProto = uri.slice(protoEnd + 3);
      const lastAt = afterProto.lastIndexOf('@');
      if (lastAt !== -1) {
        const userPass = afterProto.slice(0, lastAt);
        const hostAndRest = afterProto.slice(lastAt + 1);
        const firstColon = userPass.indexOf(':');
        if (firstColon !== -1) {
          const rawUser = userPass.slice(0, firstColon);
          const rawPass = userPass.slice(firstColon + 1);
          const user = encodeURIComponent(decodeURIComponent(rawUser));
          const pass = encodeURIComponent(decodeURIComponent(rawPass));
          
          // Ensure database name is included before query string
          let finalHost = hostAndRest;
          if (finalHost.startsWith('cluster') || finalHost.includes('.mongodb.net')) {
            const queryIdx = finalHost.indexOf('?');
            if (queryIdx !== -1) {
              const hostPart = finalHost.slice(0, queryIdx).replace(/\/+$/, '');
              const queryPart = finalHost.slice(queryIdx);
              if (!hostPart.includes('/')) {
                finalHost = `${hostPart}/campusmind${queryPart}`;
              }
            } else if (!finalHost.includes('/')) {
              finalHost = `${finalHost}/campusmind`;
            }
          }
          
          return `${proto}${user}:${pass}@${finalHost}`;
        }
      }
    }
  } catch (e) {
    // Return original if parsing fails
  }
  return uri;
}

const connectDB = async () => {
  const targetUri = sanitizeMongoUri(env.MONGODB_URI);

  try {
    mongoose.set('strictQuery', false);
    const options = {
      serverSelectionTimeoutMS: 8000,
    };

    console.log(`[DB] Attempting MongoDB connection...`);
    await mongoose.connect(targetUri, options);
    console.log('[DB] MongoDB Atlas / Database Connected Successfully!');
  } catch (err) {
    console.warn(`[DB] Could not connect to primary MongoDB (${err.message}). Starting In-Memory MongoDB Server fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memUri = memoryServerInstance.getUri();
      console.log(`[DB] In-Memory MongoDB Server started at: ${memUri}`);
      await mongoose.connect(memUri);
      console.log('[DB] Connected to In-Memory MongoDB fallback.');
    } catch (memErr) {
      console.error('[DB] Fatal error: Failed to initialize in-memory database:', memErr);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
    }
    console.log('[DB] MongoDB Disconnected.');
  } catch (err) {
    console.error('[DB] Error during disconnect:', err);
  }
};

module.exports = { connectDB, disconnectDB };
