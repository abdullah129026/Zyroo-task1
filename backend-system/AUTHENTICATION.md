# Authentication System - Complete Documentation

## Overview
Complete JWT-based authentication system with secure password hashing. Includes user registration, login, and protected routes.

---

## Quick Start

### Start Server
```bash
npm start       # Production mode
npm run dev     # Development mode
```

### Test Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "passwordConfirm": "Password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

---

## API Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "passwordConfirm": "Password123"
}
```

**Success Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "_id": "64f8c9e5b2d4e1a5b2c3d4e5",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-09-06T10:30:00.000Z",
      "updatedAt": "2026-09-06T10:30:00.000Z"
    }
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400` - Missing fields, password mismatch, password too short
- `409` - Email already registered

---

### 2. Login User
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "64f8c9e5b2d4e1a5b2c3d4e5",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-09-06T10:30:00.000Z",
      "updatedAt": "2026-09-06T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials

---

### 3. Get Current User (Protected)
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "64f8c9e5b2d4e1a5b2c3d4e5",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-09-06T10:30:00.000Z",
      "updatedAt": "2026-09-06T10:30:00.000Z"
    }
  },
  "message": "User retrieved successfully"
}
```

**Error Responses:**
- `401` - Missing/invalid/expired token

---

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String (required, min 2 characters),
  email: String (required, unique, valid format),
  password: String (required, hashed with bcrypt),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## File Structure

```
backend-system/
├── models/
│   └── User.js                          # User schema with password hashing
├── controllers/
│   └── auth.controller.js               # Register, login, getCurrentUser logic
├── middleware/
│   └── auth.js                          # JWT verification middleware
├── routes/
│   └── auth.routes.js                   # Auth endpoints
├── .env                                 # Configuration (JWT_SECRET)
├── package.json                         # Dependencies (bcrypt, jsonwebtoken)
└── AUTHENTICATION.md                    # This file
```

---

## Implementation Details

### User Model Features
- Bcrypt password hashing (10 salt rounds)
- Unique email constraint
- Automatic timestamps (createdAt, updatedAt)
- Methods: `comparePassword()`, `toJSON()`
- Password never returned in API responses

### Registration Endpoint
- Validates: name, email, password, passwordConfirm
- Email format validation
- Password minimum 6 characters
- Prevents duplicate email registration
- Returns user without password

### Login Endpoint
- Validates email and password
- Bcrypt password comparison
- JWT token generation (7-day expiration)
- Generic "Invalid credentials" message for security

### Authentication Middleware
- Extracts JWT from "Authorization: Bearer <token>" header
- Verifies token signature and expiration
- Attaches user info to `req.user`
- Rejects missing/invalid/expired tokens with 401

### Protected Route
- Requires valid JWT token
- Returns current user info
- Password excluded from response

---

## Security Features

✅ **Password Security**
- Bcrypt hashing (10 rounds)
- No plain text storage
- Per-user unique salt
- Secure comparison function

✅ **Token Security**
- JWT signature verification
- 7-day expiration
- Secure secret key
- User ID in payload

✅ **API Security**
- Generic error messages
- No information leakage
- Input validation
- Password never in responses

---

## Environment Variables

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb+srv://abdullahshaak_db_user:Asdzxcvb00@abdullah.4bclmmk.mongodb.net/?appName=Abdullah
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
```

**Production Notes:**
- Use strong random JWT_SECRET (32+ characters)
- Use different secrets for each environment
- Never commit .env file

---

## Dependencies

```json
{
  "bcrypt": "^5.1.0",           // Password hashing
  "jsonwebtoken": "^9.0.0",     // JWT generation/verification
  "mongoose": "^7.5.0",         // MongoDB ODM
  "express": "^4.18.2",         // Web framework
  "cors": "^2.8.5",             // CORS middleware
  "dotenv": "^16.3.1"           // Environment config
}
```

---

## Testing with Postman

### Import Collection
File: `Cortex_AI_Auth_Collection.postman_collection.json`

### Environment Variables
- `base_url`: http://localhost:3001
- `jwt_token`: (auto-populated after login)

### Test Flow
1. Register new user
2. Login to get token
3. Use token to access protected route (/me)

---

## Using Auth in Your Routes

### Import Middleware
```javascript
const { authenticate } = require('../middleware/auth');
```

### Protect Routes
```javascript
router.get('/protected-route', authenticate, controllerFunction);
```

### Access User Info
```javascript
const userId = req.user.userId;  // Available after authenticate middleware
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | ✅ Success |
| 201 | ✅ Created |
| 400 | ❌ Bad Request (validation error) |
| 401 | ❌ Unauthorized (missing/invalid token) |
| 409 | ❌ Conflict (duplicate email) |
| 500 | ❌ Server Error |

---

## Troubleshooting

### MongoDB Connection Error
- Ensure IP is whitelisted in MongoDB Atlas Network Access
- Connection string must be valid in .env
- Restart server after changes

### "Invalid token" Error
- Token may be expired (7-day limit)
- Token format must be: "Bearer \<token\>"
- Ensure JWT_SECRET matches server config

### "Email already registered"
- Use different email for new accounts
- Or login if account already exists

### Password Validation Fails
- Minimum 6 characters required
- passwordConfirm must match password exactly

---

## Test Scenarios

### Scenario 1: Register → Login → Access Protected Route
1. Register new user
2. Login to get token
3. Use token to call /me endpoint
4. Verify user data is returned

### Scenario 2: Invalid Credentials
1. Try login with wrong password
2. Should receive generic "Invalid credentials" error
3. No info about whether email exists

### Scenario 3: Expired Token
1. Login to get token
2. Wait 7 days or manually expire
3. Try to use expired token
4. Should receive "Token has expired" error

### Scenario 4: Missing Token
1. Call /me without Authorization header
2. Should receive "Authorization header is missing" error

---

## Response Format

All endpoints return consistent format:

```json
{
  "statusCode": 200,              // HTTP status code
  "data": { /* response data */ },  // Actual data (user, token, etc)
  "message": "Success message"    // Human-readable message
}
```

---

## Token Details

**Format:** JWT (JSON Web Token)  
**Algorithm:** HS256 (HMAC SHA-256)  
**Expiration:** 7 days (604800 seconds)  
**Payload:**
```json
{
  "userId": "64f8c9e5b2d4e1a5b2c3d4e5",
  "iat": 1693924800,
  "exp": 1694529600
}
```

---

## Security Best Practices Implemented

✅ Passwords hashed with bcrypt (10 rounds)  
✅ Passwords never stored in plain text  
✅ Password field excluded from API responses  
✅ Generic error messages (no email enumeration)  
✅ JWT signature verification  
✅ Token expiration (7 days)  
✅ HTTPS ready  
✅ CORS configured  
✅ Input validation  
✅ Secure password comparison  

---

## Frontend Integration

### Store Token After Login
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { data } = await response.json();
localStorage.setItem('authToken', data.token);
```

### Use Token in Protected Requests
```javascript
const token = localStorage.getItem('authToken');
const response = await fetch('http://localhost:3001/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Handle Token Expiration
```javascript
if (response.status === 401) {
  // Token expired, redirect to login
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

---

## Future Enhancements

- [ ] Refresh token mechanism (refresh without re-login)
- [ ] Email verification on registration
- [ ] Password reset flow
- [ ] Rate limiting on auth endpoints
- [ ] Two-factor authentication
- [ ] OAuth/Social login
- [ ] Account profile updates

---

## Support

For issues or questions:
1. Check this documentation
2. Review test examples in Postman collection
3. Check server logs: `npm run dev` shows detailed errors
4. Verify MongoDB connection in .env

---

**Version:** 1.0  
**Last Updated:** September 6, 2026  
**Status:** ✅ Production Ready
