// scripts/test-mongodb.js
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri || uri.includes('<username>') || uri.includes('<password>') || uri.includes('xxxxx')) {
  console.log('STATUS: PENDING_CONFIG');
  console.log('MONGODB_URI in .env.local is currently set to placeholder value.');
  process.exit(0);
}

async function testConnection() {
  console.log('Testing connection to MongoDB Atlas...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('STATUS: CONNECTED_SUCCESSFULLY 🎉');
    console.log('Connected host:', mongoose.connection.host);
    console.log('Connected database:', mongoose.connection.name);
    await mongoose.disconnect();
  } catch (err) {
    console.error('STATUS: CONNECTION_FAILED ❌');
    console.error('Error message:', err.message);
    process.exit(1);
  }
}

testConnection();
