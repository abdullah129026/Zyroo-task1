# MongoDB Atlas Setup Guide

## Current Issue
The server is running but cannot connect to MongoDB Atlas due to IP whitelisting.

## Error Message
```
Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Solution: Whitelist Your IP

### Step 1: Find Your Public IP Address
Run this command in PowerShell to find your public IP:
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org?format=json" -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
```

Or visit: https://www.whatismyipaddress.com/

### Step 2: Add IP to MongoDB Atlas Whitelist

1. Go to **[MongoDB Atlas Console](https://cloud.mongodb.com/)**
2. Sign in to your account
3. Select your project
4. Navigate to **Network Access** (in the left sidebar)
5. Click **"Add IP Address"** button
6. In the dialog:
   - **IP Address**: Enter your public IP (from Step 1)
   - **Description**: e.g., "My Home Computer" or "Office IP"
7. Click **"Confirm"**
8. Wait for the whitelist to be applied (usually 1-5 minutes)

### Alternative: Allow Any IP (Development Only)
For development/testing only:
1. Go to **Network Access**
2. Click **"Add IP Address"**
3. Enter: `0.0.0.0/0` (this allows any IP)
4. Click **"Confirm"**

⚠️ **Warning**: Never use `0.0.0.0/0` in production. Always use specific IP addresses.

---

## Verify Connection

After whitelisting, restart the server:
```bash
npm start
```

You should see:
```
[DB] MongoDB connected successfully (host: abdullah.4bclmmk.mongodb.net)
[SERVER] Cortex AI API is running at http://localhost:3001
```

---

## Database Connection String

Your current connection string in `.env`:
```
MONGODB_URI=mongodb+srv://abdullahshaak_db_user:Asdzxcvb00@abdullah.4bclmmk.mongodb.net/?appName=Abdullah
```

If you need to create a new user or connection string:
1. Go to MongoDB Atlas → Database Access
2. Create a new database user if needed
3. Go to Databases → Connect → Connect your application
4. Copy the connection string and replace in `.env`

---

## Testing After Connection

Once connected, run these commands to test:

### Test Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123",
    "passwordConfirm": "Password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

See [TEST_REPORT.md](./TEST_REPORT.md) for complete testing scenarios.
