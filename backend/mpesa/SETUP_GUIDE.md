# NexaStore - Setup & Configuration Guide

## Overview
This guide covers setting up the NexaStore e-commerce platform with M-Pesa payment integration and user authentication.

---

## 1. Database Setup

### Prerequisites
- PostgreSQL installed and running
- psql CLI available

### Initialize Database
```bash
cd backend
psql -U postgres -d postgres -f schema.sql
# Or manually run: psql -U your_user -d your_db -f schema.sql
```

The schema includes:
- **users** table - User accounts with email/password
- **products** table - Product catalog
- **orders** table - Order records
- **payments** table - Payment transaction history

---

## 2. Environment Configuration

### Update `.env` file
Located at `backend/.env`. Configure the following:

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nexastore

# JWT
JWT_SECRET=nexastore_super_secret_2024_xK9mP2qR7vLmNpQs
JWT_EXPIRES=7d

# M-Pesa Daraja API (sandbox)
CONSUMERKEY=your_consumer_key_here
CONSUMERSECRET=your_consumer_secret_here
PASSKEY=your_passkey_here
SHORTCODE=174379
CALLBACKURL=http://localhost:3000

# Other Config
PORT=3000
NODE_ENV=development
```

### Getting M-Pesa Credentials

1. Visit [Safaricom Daraja API Portal](https://developer.safaricom.co.ke/)
2. Create a free developer account
3. Log in and navigate to **My Applications**
4. Create a new app or use existing Sandbox app
5. Copy and paste into `.env`:
   - **Consumer Key** → `CONSUMERKEY`
   - **Consumer Secret** → `CONSUMERSECRET`
6. Go to **Account Settings** → **Test Credentials**
   - Copy **Passkey** → `PASSKEY`
   - Copy **Business Short Code** → `SHORTCODE` (usually 174379 for sandbox)
7. Set `CALLBACKURL=http://localhost:3000` (for local testing)

---

## 3. Backend Setup

### Install Dependencies
```bash
cd backend
npm install
```

### Verify All Dependencies
The following packages are required and should be installed:
```
express (4.22.1+)
cors (2.8.6+)
dotenv (16.6.1+)
jsonwebtoken (9.0.3+)
bcryptjs (2.4.3+)
pg (8.20.0+)
axios (1.14.0+)
moment (2.30.1+)
body-parser (2.2.2+)
morgan (1.10.1+)
```

If any are missing:
```bash
npm install express cors dotenv jsonwebtoken bcryptjs pg axios moment body-parser morgan
```

### Start Backend Server
```bash
npm run dev
```

Expected output:
```
[nodemon] starting `node server.js`
Server running on port 3000
```

---

## 4. Frontend Configuration

The frontend is served from the `backend` server at `http://localhost:3000`.

### Update API Base URL (if needed)
File: `frontend/js/main.js`
```javascript
const BACKEND = 'http://localhost:3000/api';
```

All AJAX requests to the backend use this base URL.

---

## 5. Feature Testing

### A. User Authentication

#### Register New User
1. Navigate to `http://localhost:3000/auth.html`
2. Click **Register**
3. Enter email and password (min 6 chars)
4. Click **Create Account**
5. Success toast: "✓ Successfully Registered!"
6. Redirects to homepage

#### Sign In
1. Go to `http://localhost:3000/auth.html`
2. Enter registered email and password
3. Click **Sign In**
4. Success toast: "✓ Successfully signed in!"
5. Redirects to homepage

#### Sign Out
1. From homepage, click account name in navbar
2. Click **Sign Out**
3. Toast: "Signed out successfully"

---

### B. M-Pesa Payment Integration

#### Prerequisites
- M-Pesa credentials configured in `.env`
- Backend server running (`npm run dev`)
- Backend must be accessible at `http://localhost:3000`

#### Test STK Push (without auth)
1. Add products to cart from homepage
2. Click **🛒** cart button → **Checkout**
3. Review items and total amount
4. Enter Kenyan phone number: `07XXXXXXXX` or `2547XXXXXXXX`
5. Click **Pay Ksh X.XX with M-Pesa**
6. STK Push prompt should appear on your phone
7. Success toast: "M-Pesa STK Push sent! Check your phone and enter your PIN."

#### Expected Flow
```
Frontend (Checkout) 
  ↓ (POST /api/payments/mpesa)
Backend (Controller)
  → Validate credentials & phone
  → Get M-Pesa Token
  → Send STK Push request
  ← Receive CheckoutRequestID
  → Save to database
  ↓ (Response)
Frontend
  → Show success toast
  → User enters PIN on phone
  → M-Pesa sends callback
Backend (Callback)
  → Process payment confirmation
  → Update database
Frontend
  → Payment complete
```

#### Troubleshooting M-Pesa

**Error: "M-Pesa configuration missing on backend"**
- Check that all M-Pesa env variables are set: `CONSUMERKEY`, `CONSUMERSECRET`, `PASSKEY`, `SHORTCODE`, `CALLBACKURL`
- Restart backend: `npm run dev`

**Error: "Could not initiate M-Pesa payment. Is the backend running?"**
- Verify backend is running on `http://localhost:3000`
- Check browser console for CORS errors
- Ensure no firewall is blocking port 3000

**Invalid phone number error**
- Use format: `07XXXXXXXX` (with leading 0) or `254XXXXXXXX`
- Must be exactly 10-12 digits

**STK not appearing on phone**
- Verify phone has active M-Pesa service
- Check sandbox credentials are correct
- Ensure `CALLBACKURL` is set correctly

---

## 6. API Endpoints

### Authentication
```
POST /api/auth/register
  Body: { firstName, lastName, email, password }
  Response: { token, user }

POST /api/auth/login
  Body: { email, password }
  Response: { token, user }

POST /api/auth/google
  Body: { email, firstName, lastName }
  Response: { token, user }
```

### Payments
```
POST /api/payments/mpesa
  Body: { amount, phoneNumber }
  Response: { success, message, data: { CheckoutRequestID, MerchantRequestID, ... } }
  Note: Authentication is OPTIONAL (for testing without login)

POST /api/payments/callback
  (Webhook from M-Pesa - automatic)
```

### Products
```
GET /api/products
  Response: Array of products

GET /api/products/:id
  Response: Single product
```

### Orders
```
POST /api/orders
  Body: { items }
  Response: { orderId, status }

GET /api/orders
  Response: Array of user's orders
```

---

## 7. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2),
  phone_number VARCHAR(20),
  checkout_request_id VARCHAR(255),
  merchant_request_id VARCHAR(255),
  mpesa_receipt_number VARCHAR(255),
  response_code VARCHAR(10),
  response_description TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 8. Local Storage Structure

The frontend uses `localStorage` to persist data:

```javascript
// Cart items
localStorage.getItem('betaCart') 
// → [{ id, name, price, qty, ... }]

// User info
localStorage.getItem('betaUser')
// → { id, name, email, role }

// Auth token
localStorage.getItem('betaToken')
// → JWT token string
```

---

## 9. Deployment Checklist

Before deploying to production:

- [ ] Change `NODE_ENV=production` in `.env`
- [ ] Update `DATABASE_URL` to production database
- [ ] Use real M-Pesa credentials (production), not sandbox
- [ ] Set valid `CALLBACKURL` (must be publicly accessible)
- [ ] Update frontend `BACKEND` URL to production
- [ ] Enable HTTPS for all endpoints
- [ ] Set strong `JWT_SECRET`
- [ ] Configure database backups
- [ ] Set up error logging
- [ ] Enable CORS only for your domain
- [ ] Test all payment flows before launch

---

## 10. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot POST /api/auth/login" | Backend not running | Run `npm run dev` in backend folder |
| DB connection error | Wrong DATABASE_URL | Check PostgreSQL is running, credentials correct |
| CORS error in console | Backend CORS not configured | Verify CORS middleware in server.js |
| Token invalid | JWT_SECRET mismatch | Ensure JWT_SECRET is same in .env and code |
| Payment fails in sandbox | Credentials not set | Add M-Pesa credentials to .env file |
| Cart empty after refresh | Not using localStorage | Check localStorage API is available |

---

## 11. Development Tips

### Hot Reload
Backend auto-restarts with nodemon on file changes:
```bash
npm run dev
```

### Debug Mode
Add debug logs:
```javascript
// Frontend
console.log('M-Pesa response:', data);

// Backend
console.error('MPesa error:', error);
```

### Postman Testing
Test endpoints with Postman:
```
Method: POST
URL: http://localhost:3000/api/payments/mpesa
Headers: 
  - Content-Type: application/json
Body (raw):
  {
    "amount": 29.98,
    "phoneNumber": "0712345678"
  }
```

---

## 12. Support & Resources

- [Safaricom Daraja API Docs](https://developer.safaricom.co.ke/)
- [M-Pesa STK Push Guide](https://developer.safaricom.co.ke/documentation#lipa-na-m-pesa-online-stk-push)
- [Express.js Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## Next Steps

1. ✅ Complete database setup
2. ✅ Add M-Pesa credentials to `.env`
3. ✅ Run backend: `npm run dev`
4. ✅ Test authentication at `/auth.html`
5. ✅ Test M-Pesa on checkout page
6. ✅ Monitor console for errors
7. ✅ Deploy when ready

---

**Version**: 1.0  
**Last Updated**: April 2026  
