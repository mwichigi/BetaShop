# 🚨 M-Pesa 400 Error - Root Cause Found & Fixed

## ❌ The Problem
Your terminal shows:
```
❌ Token generation failed: Request failed with status code 400
❌ Failed to get access token: Request failed with status code 400
```

**Root Cause:** Your `backend/.env` file contains **placeholder credential values** instead of real Safaricom sandbox credentials.

## ✅ The Solution

### 1. Get Real Credentials
Visit: https://developer.safaricom.co.ke/
- Login to your account
- Go to **My Apps**
- Select your app (create one if needed)
- Copy **Test Credentials**:
  - Consumer Key
  - Consumer Secret
  - Passkey

### 2. Update `.env` File
**Location:** `backend/.env`

Replace:
```env
CONSUMERKEY=your_consumer_key_here          # ❌ Wrong
CONSUMERSECRET=your_consumer_secret_here    # ❌ Wrong
PASSKEY=your_passkey_here                   # ❌ Wrong
```

With your actual values:
```env
CONSUMERKEY=abc123xyz...                    # ✅ Correct
CONSUMERSECRET=xyz789abc...                 # ✅ Correct
PASSKEY=def456ghi...                        # ✅ Correct
```

### 3. Test Credentials
Run the test script I created:
```bash
cd backend
node test-credentials.js
```

**Expected output after fix:**
```
✅ SUCCESS: Access token received!
   Token: Bearer abc123...
   Your M-Pesa credentials are working correctly.
```

### 4. Restart Backend & Test Payment
```bash
# Stop current server (Ctrl+C)
npm start
```

Then test payment with phone: `0708374149`

## 📊 Why This Happens

M-Pesa API validates credentials **before** processing any payment request. When you send placeholder values like "your_consumer_key_here", Safaricom's servers:

1. ✅ Receive the request
2. ❌ Validate credentials → **FAIL** (400 error)
3. 🚫 Never check phone number, amount, or other fields

## 🛠️ Files Created/Modified

- ✅ `backend/controllers/payments.js` - Enhanced with detailed logging
- ✅ `backend/.env` - Added comments about placeholder values
- ✅ `MPESA_CREDENTIALS_FIX.md` - Step-by-step fix guide
- ✅ `backend/test-credentials.js` - Credential validation script

## 🎯 Next Steps

1. **Get credentials** from Safaricom Developer Portal
2. **Update `.env`** with real values
3. **Run test script** to verify credentials work
4. **Restart backend** and test payment
5. **STK Push should work!**

---

**The code is correct** - you just need valid credentials. Once you add them, the payment flow will work perfectly! 🎉