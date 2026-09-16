# Quick Reference - Authentication API

## 🚀 Server Start
```bash
npm start       # Production mode
npm run dev     # Development mode
```

---

## 📋 Endpoints

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "passwordConfirm": "SecurePass123"
}

Response: 201 Created
{
  "statusCode": 201,
  "data": { "user": {...} },
  "message": "User registered successfully"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response: 200 OK
{
  "statusCode": 200,
  "data": {
    "user": {...},
    "token": "eyJhbGci..."
  },
  "message": "Login successful"
}
```

### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer eyJhbGci...

Response: 200 OK
{
  "statusCode": 200,
  "data": { "user": {...} },
  "message": "User retrieved successfully"
}
```

---

## 🔐 Using in Your Routes

```javascript
const { authenticate } = require('../middleware/auth');
const router = require('express').Router();

// Protected route
router.get('/my-data', authenticate, (req, res) => {
  const userId = req.user.userId;  // User ID from token
  // ... your logic
});

module.exports = router;
```

---

## 🧪 Quick Test with Postman

1. Import: `Cortex_AI_Auth_Collection.postman_collection.json`
2. Set `base_url`: `http://localhost:3001`
3. Run tests in order

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | ✅ Success |
| 201 | ✅ Created |
| 400 | ❌ Bad Request (validation) |
| 401 | ❌ Unauthorized (missing/invalid token) |
| 409 | ❌ Conflict (duplicate email) |
| 500 | ❌ Server Error |

---

## 🔑 Environment Variables

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

---

## ⏱️ Token Expiration

- **Expiry**: 7 days
- **Format**: Bearer \<token\>
- **Storage**: localStorage or cookies (frontend)

---

## 🆘 Common Issues

### MongoDB won't connect
→ See [MONGODB_SETUP.md](./MONGODB_SETUP.md)

### "Invalid token" error
→ Token may be expired or invalid format

### "Email already registered"
→ Use different email for new accounts

### Password validation fails
→ Minimum 6 characters required

---

## 📁 File Structure

```
backend-system/
├── models/User.js              # User schema
├── controllers/auth.controller.js
├── middleware/auth.js           # JWT verification
├── routes/auth.routes.js        # /register, /login, /me
└── documentation files
```

---

## 🎯 Next Steps

1. Whitelist IP in MongoDB Atlas (if needed)
2. Restart server: `npm start`
3. Test with Postman
4. Verify passwords are hashed in database
5. Integrate frontend application with auth endpoints

---

## 📚 Full Documentation

- `AUTH_ENDPOINTS.md` - Complete API docs
- `TEST_REPORT.md` - Test scenarios
- `WEEK2_SUMMARY.md` - Feature details

---

**Last Updated**: 2026-09-06  
**Status**: ✅ Complete
