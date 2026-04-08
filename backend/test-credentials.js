const axios = require('axios');
require('dotenv').config();

const TOKEN_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

async function testMpesaCredentials() {
  console.log('🧪 Testing M-Pesa Credentials...\n');

  const key = process.env.CONSUMERKEY;
  const secret = process.env.CONSUMERSECRET;

  console.log('📋 Current credentials:');
  console.log(`   Consumer Key: ${key ? key.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`   Consumer Secret: ${secret ? secret.substring(0, 10) + '...' : 'NOT SET'}\n`);

  if (!key || !secret || key.includes('your_consumer') || secret.includes('your_consumer')) {
    console.log('❌ ERROR: Credentials are still placeholder values!');
    console.log('   Please update backend/.env with real credentials from:');
    console.log('   https://developer.safaricom.co.ke/\n');
    return;
  }

  try {
    console.log('🔑 Attempting to get access token...');

    const token = Buffer.from(`${key}:${secret}`).toString('base64');
    const response = await axios.get(TOKEN_URL, {
      headers: { Authorization: `Basic ${token}` }
    });

    console.log('✅ SUCCESS: Access token received!');
    console.log(`   Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log('   Your M-Pesa credentials are working correctly.\n');

  } catch (error) {
    console.log('❌ FAILED: Could not get access token');
    console.log(`   Error: ${error.response?.data?.errorMessage || error.message}`);
    console.log('   Please check your credentials in backend/.env\n');

    if (error.response?.status === 400) {
      console.log('💡 Tip: 400 error usually means invalid credentials');
    }
  }
}

testMpesaCredentials();