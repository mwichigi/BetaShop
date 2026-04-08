# 🔑 M-Pesa Credentials Setup - Fix 400 Errors

## ❌ Current Problem
Your backend is getting **400 errors** from M-Pesa because your `.env` file contains **placeholder credentials** instead of real ones.

Terminal shows:
```
❌ Token generation failed: Request failed with status code 400
❌ Failed to get access token: Request failed with status code 400
```

## ✅ How to Fix It

### Step 1: Get Your Real M-Pesa Sandbox Credentials

1. **Go to Safaricom Developer Portal:**
   - Visit: https://developer.safaricom.co.ke/
   - Login with your account (create one if needed)

2. **Navigate to Your App:**
   - Click **"My Apps"** in the menu
   - Select your app (or create a new one if you don't have one)

3. **Get Your Credentials:**
   - In your app dashboard, look for **"Test Credentials"** section
   - Copy these three values:
     - **Consumer Key** (looks like: `abc123xyz...`)
     - **Consumer Secret** (looks like: `xyz789abc...`)
     - **Passkey** (usually in a separate section, looks like: `def456ghi...`)

### Step 2: Update Your `.env` File

**File location:** `backend/.env`

Replace these lines:
```env
# BEFORE (wrong - placeholders):
CONSUMERKEY=your_consumer_key_here
CONSUMERSECRET=your_consumer_secret_here
PASSKEY=your_passkey_here

# AFTER (correct - your actual credentials):
CONSUMERKEY=abc123xyz...your_actual_consumer_key
CONSUMERSECRET=xyz789abc...your_actual_consumer_secret
PASSKEY=def456ghi...your_actual_passkey
```

**Important:**
- Copy the credentials **exactly** as shown in Safaricom dashboard
- No extra spaces or quotes
- The values are case-sensitive

### Step 3: Restart Your Backend

```bash
# In VS Code terminal, navigate to backend folder:
cd backend

# Stop the current server (Ctrl+C if running)
# Then restart:
npm start
```

### Step 4: Test the Payment

1. **Open your app:** http://localhost:3000
2. **Add items to cart**
3. **Click "Checkout"**
4. **Enter phone:** `0708374149` (sandbox test number)
5. **Click "Pay Ksh X.XX with M-Pesa"**

### 📊 Expected Results After Fix

**Terminal should show:**
```
✅ Phone validation passed: 254708374149
✅ M-Pesa config verified
🔑 Getting M-Pesa access token...
✅ Access token received
📤 Sending STK push to M-Pesa:
{ "BusinessShortCode": 174379, "Amount": 30, ... }
📥 M-Pesa response: { "ResponseCode": "0", ... }
✅ STK Push successful!
```

**Frontend should show:**
- "Checking payment status..." with countdown
- Success message when payment completes

## 🐛 If You Still Get 400 Errors

### Check These Common Issues:

1. **Credentials Still Placeholder:**
   - Double-check `.env` has real values, not "your_consumer_key_here"

2. **Extra Characters:**
   - No spaces around `=` sign
   - No quotes around values
   - No line breaks in middle of values

3. **Wrong App:**
   - Make sure you're copying from **Test Credentials** section
   - Not from Production credentials

4. **App Not Approved:**
   - Your Safaricom app might need approval
   - Check app status in developer portal

5. **Copy-Paste Errors:**
   - Try typing the credentials manually instead of copy-paste
   - Some characters might not copy correctly

### Debug Steps:

1. **Check your `.env` file:**
   ```bash
   # In backend folder:
   cat .env | grep CONSUMER
   ```

2. **Test credentials format:**
   - Consumer Key: Should be ~20-30 characters, alphanumeric
   - Consumer Secret: Should be ~30-40 characters, alphanumeric
   - Passkey: Should be ~20-30 characters, alphanumeric

3. **Check Safaricom Dashboard:**
   - Login again and verify the credentials haven't changed
   - Try regenerating credentials if possible

## 📞 Test Phone Numbers (Sandbox)

Use these for testing:
- `0708374149` - Primary test number
- `254708374149` - With country code
- `0712345678` - Alternative test number

## ⏱️ What Happens Next

Once credentials are correct:
1. **STK Push** will be sent to the test phone
2. **Frontend** will poll for 90 seconds waiting for confirmation
3. **Database** will record the payment
4. **Cart** will be cleared on successful payment

---

**Need Help?**
- Check the terminal logs for detailed error messages
- Verify credentials are copied exactly from Safaricom
- Ensure your app has "STK Push" API enabled in Safaricom dashboard
