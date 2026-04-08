# 🚀 NexaStore Quick Start Guide

## Prerequisites
- Node.js v10+ installed
- PostgreSQL running locally
- M-Pesa Daraja API credentials (from Safaricom)

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Configure Database
```bash
# Use PostgreSQL to create database
psql -U postgres -d postgres -f schema.sql
```

### Step 2: Update M-Pesa Credentials
Edit `backend/.env`:
```env
CONSUMERKEY=abc123xyz       # From Safaricom
CONSUMERSECRET=xyz789abc    # From Safaricom  
PASSKEY=your_passkey_123    # From Safaricom Account Settings
SHORTCODE=174379            # Sandbox: 174379, Production: your shortcode
CALLBACKURL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexastore
```

### Step 3: Start Backend
```bash
cd backend
npm run dev
```

Expected output:
```
[nodemon] starting `node server.js`
Server running on port 3000
```

### Step 4: Open in Browser
```
http://localhost:3000
```

---

## 🧪 Test Features

### 1. Register New User
- Click account icon → "Sign In"
- Click "Register"
- Enter email/password
- ✅ Success toast appears
- ✅ Redirected to homepage

### 2. Test Login
- Go to `/auth.html`
- Enter credentials
- Click "Sign In"
- ✅ Toast: "✓ Successfully signed in!"
- ✅ Redirected to homepage

### 3. Test M-Pesa STK Push
- Add products to cart
- Click cart → checkout
- Enter M-Pesa number: `07XXXXXXXX`
- Click "Pay with M-Pesa"
- ✅ Toast: "M-Pesa STK Push sent!"
- ✅ Check your phone for STK prompt

---

## 📋 What Was Implemented

### ✅ Authentication System
- User registration with email/password
- Secure login with JWT tokens
- Persistent sessions
- Toast notifications (success/error)
- Auto-redirect after auth

### ✅ M-Pesa Integration  
- STK Push initialization
- Phone number validation
- Optional authentication (test without login)
- Transaction recording
- Callback handling
- Detailed error messages

### ✅ Improved UX
- Redesigned checkout page
- Better payment form
- Color-coded notifications
- Form validation
- Loading states

---

## 📁 Modified Files

| File | Changes |
|------|---------|
| `.env` | Added M-Pesa credentials |
| `controllers/payments.js` | Enhanced error handling |
| `middleware/auth.js` | Added optionalAuth |
| `routes/payments.js` | Updated to use optionalAuth |
| `checkout.html` | Complete redesign |
| `js/auth-page.js` | Enhanced auth flow |
| `js/main.js` | Enhanced toasts |
| `js/cart.js` | Removed auth requirement |
| `js/api.js` | Added M-Pesa endpoint |

---

## 🔧 Configuration Checklist

- [ ] M-Pesa credentials added to `.env`
- [ ] Database initialized with `schema.sql`
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend running (`npm run dev`)
- [ ] Can access `http://localhost:3000`
- [ ] Can register new user
- [ ] Can login with registered user
- [ ] Can test M-Pesa payment (with valid phone)

---

## ❌ Troubleshooting

### Issue: "M-Pesa configuration missing"
**Solution:**
1. Open `backend/.env`
2. Verify all 5 M-Pesa variables are filled:
   - CONSUMERKEY
   - CONSUMERSECRET
   - PASSKEY
   - SHORTCODE
   - CALLBACKURL
3. Restart backend: `npm run dev`

### Issue: Database connection error
**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres

# Check database exists
psql -U postgres -l | grep nexastore

# If not, create it:
createdb -U postgres nexastore

# Run schema:
psql -U postgres -d nexastore -f schema.sql
```

### Issue: "Cannot find module"
**Solution:**
```bash
cd backend
npm install
npm run dev
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

---

## 📚 Documentation

For detailed setup see:
- `SETUP_GUIDE.md` - Complete configuration guide
- `IMPLEMENTATION_SUMMARY.md` - All changes made

---

## 🎯 Next Steps

### For Testing
1. ✅ Verify all checklist items above
2. ✅ Test auth flow (register/login)
3. ✅ Test M-Pesa with valid phone
4. ✅ Monitor browser console for errors
5. ✅ Check backend terminal for server logs

### For Production
1. Get production M-Pesa credentials
2. Update `.env` with production config
3. Update `CALLBACKURL` to your domain
4. Change `NODE_ENV=production`
5. Deploy to production server
6. Run database migrations
7. Test all flows in production

---

## 🆘 Support

**Error Messages During Testing?**
1. Check browser console (F12 → Console)
2. Check backend terminal for stack trace
3. Review error in toast notification
4. Check firewall isn't blocking port 3000

**M-Pesa not working?**
1. Verify credentials in `.env` are correct
2. Check phone has active M-Pesa
3. Ensure backend is running
4. Check CALLBACKURL is accessible

---

## 📞 Quick Reference

| Action | Location |
|--------|----------|
| Homepage | `http://localhost:3000/` |
| Auth | `http://localhost:3000/auth.html` |
| Checkout | `http://localhost:3000/checkout.html` |
| Config | `backend/.env` |
| Routes | `backend/routes/` |
| Controllers | `backend/controllers/` |
| DB Schema | `backend/schema.sql` |

---

**Status**: ✅ Ready to Test  
**Tested With**: Node.js v10.8.2, npm v6+  
**Database**: PostgreSQL  
**Framework**: Express.js  
**Payment Provider**: Safaricom M-Pesa (Daraja API)  

---

## 🎉 You're All Set!

```bash
cd backend
npm run dev
# Then open: http://localhost:3000
```

Start testing immediately! 🚀
