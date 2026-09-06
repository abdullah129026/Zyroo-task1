/**
 * MongoDB Connection Test Script
 * Run: node test-connection.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║      MongoDB Connection Diagnostic Tool            ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const mongoUri = process.env.MONGODB_URI;

console.log('📋 Configuration:');
console.log(`   Connection String: ${mongoUri}`);
console.log(`   Node Environment: ${process.env.NODE_ENV}`);
console.log(`   Server Port: ${process.env.PORT}\n`);

// Extract hostname from connection string
const match = mongoUri.match(/@([^/?]+)/);
const hostname = match ? match[1] : 'unknown';

console.log('🔍 Attempting connection...\n');

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  connectTimeoutMS: 5000,
})
  .then(() => {
    console.log('✅ SUCCESS! MongoDB is connected!\n');
    console.log('   Database Host:', hostname);
    console.log('   Connection State:', mongoose.connection.readyState);
    console.log('   Database Name:', mongoose.connection.name);
    
    console.log('\n✨ Your configuration is correct!');
    console.log('   Try running: npm start\n');
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ CONNECTION FAILED!\n');
    console.log('🔧 Troubleshooting Steps:\n');
    
    const errorMsg = err.message.toLowerCase();
    
    if (errorMsg.includes('getaddrinfo') || errorMsg.includes('enotfound')) {
      console.log('   ERROR: DNS Resolution Failed');
      console.log('   • Check your internet connection');
      console.log('   • Try: ping google.com');
      console.log('   • MongoDB Atlas hostname may be unreachable\n');
    }
    
    if (errorMsg.includes('ip') || errorMsg.includes('whitelist') || errorMsg.includes('connect')) {
      console.log('   ERROR: IP Whitelist or Connection Issue');
      console.log('   Steps:');
      console.log('   1. Go to: https://cloud.mongodb.com/');
      console.log('   2. Select your project');
      console.log('   3. Go to: Network Access');
      console.log('   4. Find your IP and verify it\'s whitelisted');
      console.log('   5. Or add 0.0.0.0/0 for development (not production!)\n');
    }
    
    if (errorMsg.includes('timeout')) {
      console.log('   ERROR: Connection Timeout');
      console.log('   • Network may be slow or blocking connection');
      console.log('   • Try disabling VPN if using one');
      console.log('   • Check firewall settings\n');
    }
    
    if (errorMsg.includes('authentication')) {
      console.log('   ERROR: Authentication Failed');
      console.log('   • Check username in connection string');
      console.log('   • Check password in connection string');
      console.log('   • Verify user exists in MongoDB Atlas\n');
    }
    
    console.log('📝 Full Error Message:');
    console.log(`   ${err.message}\n`);
    
    console.log('💡 Helpful Resources:');
    console.log('   • MongoDB Atlas: https://cloud.mongodb.com/');
    console.log('   • Network Access Guide: https://www.mongodb.com/docs/atlas/security-whitelist/');
    console.log('   • Connection Troubleshooting: https://www.mongodb.com/docs/atlas/troubleshoot-connection/\n');
    
    process.exit(1);
  });
