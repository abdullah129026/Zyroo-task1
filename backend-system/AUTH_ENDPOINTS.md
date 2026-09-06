# Authentication Endpoints Documentation

## Overview
This document provides detailed information about the authentication endpoints implemented in Week 2.

## Base URL
```
http://localhost:3001/api/auth
```

---

## 1. Register Endpoint

### POST `/api/auth/register`
Register a new user account.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "passwordConfirm": "SecurePassword123"
}
```

**Request Parameters:**
- `name` (string, required): User's full name (minimum 2 characters)
- `email` (string, required): User's email address (must be unique and valid format)
- `password` (string, required): Password (minimum 6 characters)
- `passwordConfirm` (string, required): Password confirmation (must match password)

**Success Response (201 Created):**
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

**400 Bad Request** - Missing fields:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "All fields are required"
}
```

**400 Bad Request** - Passwords don't match:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Passwords do not match"
}
```

**400 Bad Request** - Password too short:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Password must be at least 6 characters long"
}
```

**409 Conflict** - Email already registered:
```json
{
  "statusCode": 409,
  "data": null,
  "message": "Email is already registered"
}
```

---

## 2. Login Endpoint

### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Request Parameters:**
- `email` (string, required): User's registered email
- `password` (string, required): User's password

**Success Response (200 OK):**
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NGY4YzllNWIyZDRlMWE1YjJjM2Q0ZTUiLCJpYXQiOjE2OTQ5ODQyMDAsImV4cCI6MTY5NTU4OTAwMH0.xyz..."
  },
  "message": "Login successful"
}
```

**Error Responses:**

**400 Bad Request** - Missing credentials:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Email and password are required"
}
```

**401 Unauthorized** - Invalid credentials:
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Invalid credentials"
}
```

---

## 3. Get Current User (Protected Route)

### GET `/api/auth/me`
Retrieve the authenticated user's information.

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200 OK):**
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

**401 Unauthorized** - Missing authorization header:
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Authorization header is missing"
}
```

**401 Unauthorized** - Missing token:
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Token is missing"
}
```

**401 Unauthorized** - Invalid token:
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Invalid token"
}
```

**401 Unauthorized** - Token expired:
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Token has expired"
}
```

---

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with a salt of 10 before storing in the database.
2. **Unique Email Constraint**: MongoDB enforces a unique constraint on the email field.
3. **JWT Token**: Tokens expire after 7 days and include the user ID in the payload.
4. **Generic Error Messages**: Login returns generic "Invalid credentials" message for security.
5. **Password Exclusion**: Password field is never returned in API responses.

---

## Testing with Postman

### Import Collection
You can import the provided Postman collection to test all endpoints.

### Manual Testing Steps

#### 1. Register a User
- Method: POST
- URL: `http://localhost:3001/api/auth/register`
- Body (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Password123",
  "passwordConfirm": "Password123"
}
```

#### 2. Login
- Method: POST
- URL: `http://localhost:3001/api/auth/login`
- Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```
- Save the `token` from the response

#### 3. Get Current User (Protected Route)
- Method: GET
- URL: `http://localhost:3001/api/auth/me`
- Headers: Add new header
  - Key: `Authorization`
  - Value: `Bearer <paste_token_here>`

---

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
```

**Note**: In production, use a strong, randomly generated secret key (minimum 32 characters).

---

## Token Expiration

- Tokens expire after **7 days** (604800 seconds)
- After expiration, users must log in again to get a new token

---

## File Structure

```
backend-system/
├── models/
│   └── User.js                 # User schema with password hashing
├── controllers/
│   └── auth.controller.js       # Authentication logic
├── middleware/
│   └── auth.js                  # JWT verification middleware
├── routes/
│   └── auth.routes.js           # Auth endpoints
└── AUTH_ENDPOINTS.md            # This documentation
```

---

## Future Enhancements

- [ ] Refresh token mechanism
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] OAuth/Social login integration
