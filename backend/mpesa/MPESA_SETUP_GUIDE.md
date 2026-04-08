# M-Pesa Sandbox Setup Guide

## 🔴 Current Issue: 400 Bad Request
Your M-Pesa requests are failing because the credentials in `.env` are likely placeholder values, not actual sandbox credentials.

## ✅ How to Fix It

### Step 1: Get Your M-Pesa Sandbox Credentials
1. Visit: https://developer.safaricom.co.ke/
2. Login or create an account
3. Navigate to **My Apps** → Create new app (if needed)
4. Look for these values in your app settings:
   - **Consumer Key**
   - **Consumer Secret**
   - **Passkey** (usually in Test Credentials section)

### Step 2: Update Your `.env` File
Edit `backend/.env` and replace:

```env
# Before (wrong - placeholders):
CONSUMERKEY=abc123xyz_from_safaricom
CONSUMERSECRET=xyz789abc_from_safaricom
PASSKEY=your_passkey_from_settings

# After (correct - your actual credentials):
CONSUMERKEY=your_actual_consumer_key_from_safaricom
CONSUMERSECRET=your_actual_consumer_secret_from_safaricom
PASSKEY=your_actual_passkey_from_safaricom
```

Keep these other values:
```env
SHORTCODE=174379
CALLBACKURL=http://localhost:3000
```

### Step 3: Restart Your Backend
```bash
# Kill the current server (Ctrl+C in terminal)
# Then restart it:
npm start
```

### Step 4: Test Payment
1. Go to http://localhost:3000
2. Add items to cart
3. Click **Checkout**
4. Enter test phone: `0708374149` or `254708374149`
5. Click **Pay Ksh X.XX with M-Pesa**

### 📊 Expected Behavior

**With sandbox credentials:**
- ✅ Frontend shows "Checking payment status..." countdown
- ✅ Backend console shows detailed logs with payload
- ✅ M-Pesa responds with status code 0 (success)
- ✅ STK prompt appears on test phone (or simulator)

**Without credentials (what's happening now):**
- ❌ 400 errors from M-Pesa
- ❌ Backend logs show missing config
- ❌ Requests rejected before reaching M-Pesa

### 🐛 Debug Logs
After restart, check your backend terminal for logs like:

```
✅ Phone validation passed: 254708374149
✅ M-Pesa config verified
📤 Sending STK push to M-Pesa:
{
  "BusinessShortCode": 174379,
  "Amount": 30,
  "PartyA": 254708374149,
  ...
}
📥 M-Pesa response: { "ResponseCode": "0", ... }
✅ STK Push successful!
```

If you still see `❌ M-Pesa config missing`, check that:
1. Your `.env` file is in `backend/` folder
2. Credentials have no extra spaces or quotes
3. You restarted the server after editing `.env`

### 📞 Test Phone Numbers (Sandbox)
- `0708374149` - Standard test number
- `254708374149` - With country code

### ⏱️ Polling Timeout
Frontend waits 90 seconds for payment confirmation. In sandbox, you'll need to manually confirm via Safaricom's management panel.

---

**Need More Help?**
- Check backend console for detailed error messages
- Verify credentials are correct (copy from Safaricom dashboard exactly)
- Ensure database is running: `psql -U postgres`
