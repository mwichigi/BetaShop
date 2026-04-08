const axios = require('axios');
const db = require('../db');

const MPESA_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const TOKEN_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

// Format phone to 254XXXXXXXXX format
function formatPhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digits
  let formatted = phone.toString().replace(/\D/g, '');
  
  console.log('📞 Phone formatting:', { input: phone, afterRemoval: formatted });
  
  // If starts with 0, replace with 254
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.slice(1);
  }
  // If just starts with 7, prepend 254
  else if (!formatted.startsWith('254') && formatted.startsWith('7')) {
    formatted = '254' + formatted;
  }
  // If already starts with 254, keep as is
  
  console.log('📞 Final formatted phone:', formatted);
  return formatted;
}

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const date = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${date}${hours}${minutes}${seconds}`;
}

function createPassword(shortcode, passkey, timestamp) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

async function getAccessToken() {
  try {
    const key = process.env.CONSUMERKEY;
    const secret = process.env.CONSUMERSECRET;
    
    if (!key || !secret) {
      throw new Error('M-Pesa consumer key or secret missing');
    }
    
    const token = Buffer.from(`${key}:${secret}`).toString('base64');
    
    console.log('🔑 Getting M-Pesa access token...');
    
    const response = await axios.get(TOKEN_URL, {
      headers: { Authorization: `Basic ${token}` }
    });
    
    console.log('✅ Access token received');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    throw error;
  }
}

exports.initiateMpesa = async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;

    console.log('📲 M-Pesa payment request:', { amount, phoneNumber });

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    // Validate phone
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Format phone
    const formattedPhone = formatPhone(phoneNumber);
    
    // Validate formatted phone: must be 254XXXXXXXXX format (12 digits, 7 as 4th digit)
    if (!formattedPhone || !/^254[0-9]{9}$/.test(formattedPhone)) {
      console.warn('❌ Invalid phone format:', formattedPhone);
      return res.status(400).json({ success: false, message: `Invalid phone format: ${formattedPhone}. Use 07XXXXXXXX or 254XXXXXXXXX` });
    }

    console.log('✅ Phone validation passed:', formattedPhone);

    // Check M-Pesa configuration
    const consumerKey = process.env.CONSUMERKEY;
    const consumerSecret = process.env.CONSUMERSECRET;
    const passkey = process.env.PASSKEY;
    const shortcode = process.env.SHORTCODE;
    const callbackUrl = process.env.CALLBACKURL;

    if (!consumerKey || !consumerSecret || !passkey || !shortcode || !callbackUrl) {
      console.error('❌ M-Pesa config missing:', {
        CONSUMERKEY: !!consumerKey,
        CONSUMERSECRET: !!consumerSecret,
        PASSKEY: !!passkey,
        SHORTCODE: !!shortcode,
        CALLBACKURL: !!callbackUrl
      });
      return res.status(500).json({ 
        success: false, 
        message: 'M-Pesa credentials not configured. Add CONSUMERKEY, CONSUMERSECRET, PASSKEY, SHORTCODE, CALLBACKURL to .env file' 
      });
    }

    console.log('✅ M-Pesa config verified');

    // Get access token
    let authToken;
    try {
      authToken = await getAccessToken();
    } catch (tokenError) {
      console.error('❌ Failed to get access token:', tokenError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to authenticate with M-Pesa. Check your credentials.' 
      });
    }

    // Create STK push payload
    const timestamp = getTimestamp();
    const password = createPassword(shortcode, passkey, timestamp);

    const payload = {
      BusinessShortCode: Number(shortcode),
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(Number(amount)), // Ensure integer
      PartyA: Number(formattedPhone),
      PartyB: Number(shortcode),
      PhoneNumber: Number(formattedPhone),
      CallBackURL: `${callbackUrl}/api/payments/callback`,
      AccountReference: 'βetaShop',
      TransactionDesc: 'Payment'
    };

    console.log('📤 Sending STK push to M-Pesa:', JSON.stringify(payload, null, 2));

    // Send STK push request
    let mpesaResponse;
    try {
      mpesaResponse = await axios.post(MPESA_URL, payload, {
        headers: { 
          Authorization: `Bearer ${authToken}`, 
          'Content-Type': 'application/json' 
        }
      });
    } catch (mpesaError) {
      console.error('❌ M-Pesa API error:', {
        status: mpesaError.response?.status,
        data: mpesaError.response?.data,
        message: mpesaError.message
      });
      return res.status(400).json({ 
        success: false, 
        message: `M-Pesa error: ${mpesaError.response?.data?.errorMessage || mpesaError.message}` 
      });
    }

    const data = mpesaResponse.data;
    console.log('📥 M-Pesa response:', data);

    // Save payment record to database
    try {
      await db.query(
        'INSERT INTO payments(user_id, amount, phone_number, checkout_request_id, merchant_request_id, response_code, response_description, customer_message, status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [
          req.user?.id || null,
          amount,
          formattedPhone,
          data.CheckoutRequestID || null,
          data.MerchantRequestID || null,
          data.ResponseCode || null,
          data.ResponseDescription || null,
          data.CustomerMessage || null,
          data.ResponseCode === '0' ? 'pending' : 'failed'
        ]
      );
      console.log('✅ Payment recorded in database');
    } catch (dbErr) {
      console.error('⚠️ Database save error (non-critical):', dbErr.message);
      // Continue - M-Pesa request succeeded even if DB save fails
    }

    // Check M-Pesa response code
    if (data.ResponseCode === '0') {
      console.log('✅ STK Push successful!');
      return res.json({ 
        success: true, 
        message: data.CustomerMessage || 'STK Push initiated successfully', 
        data 
      });
    }

    // M-Pesa returned non-zero response code
    console.warn('⚠️ M-Pesa returned non-zero response:', data.ResponseCode);
    return res.status(400).json({ 
      success: false, 
      message: data.ResponseDescription || 'M-Pesa push failed', 
      data 
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An unexpected error occurred' 
    });
  }
};

exports.mpesaCallback = async (req, res) => {
  try {
    console.log('📥 M-Pesa callback received');
    
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      console.error('❌ Invalid callback payload');
      return res.status(400).json({ success: false, message: 'Invalid callback payload' });
    }

    const { MerchantRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
    const status = ResultCode === 0 ? 'success' : 'failed';
    const metadata = CallbackMetadata?.Item || [];
    const amount = metadata.find(i => i.Name === 'Amount')?.Value || null;
    const receipt = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value || null;
    const transactionDate = metadata.find(i => i.Name === 'TransactionDate')?.Value || null;
    const phoneNumber = metadata.find(i => i.Name === 'PhoneNumber')?.Value || null;

    console.log('✅ Callback processed:', { status, amount, receipt });

    await db.query(
      'UPDATE payments SET status = $1, amount = COALESCE($2, amount), mpesa_receipt_number = $3, transaction_date = $4, phone_number = COALESCE($5, phone_number), response_description = $6 WHERE merchant_request_id = $7',
      [status, amount, receipt, transactionDate, phoneNumber, ResultDesc, MerchantRequestID]
    );

    return res.json({ success: true, message: ResultDesc });
  } catch (error) {
    console.error('❌ Callback error:', error.message);
    return res.status(500).json({ success: false, message: 'Callback processing failed' });
  }
};