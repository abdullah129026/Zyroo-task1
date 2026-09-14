# Document Processing & Semantic Search - Testing Guide

## Setup

### 1. Environment Configuration
Before testing, ensure your `.env` file has:
```
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb+srv://abdullahshaak_db_user:Asdzxcvb00@abdullah.4bclmmk.mongodb.net/?appName=Abdullah
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
GOOGLE_GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
```

### 2. Get Google Gemini API Key
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key and add it to `.env`

### 3. Create MongoDB Atlas Vector Index
See DOCUMENT_PROCESSING.md for instructions on creating the vector index on the `chunks` collection.

### 4. Start Server
```powershell
cd d:\Work\Zyroo-Task1\backend-system
npm start
```

You should see:
```
[SERVER] MongoDB connection established
[SERVER] Google Gemini embeddings client initialized
[SERVER] Cortex AI API is running at http://localhost:3001
```

## Test Sequence

### Test 1: Health Check
```bash
curl -X GET http://localhost:3001/api/health
```

Expected Response (200):
```json
{
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "database": "connected"
  }
}
```

---

### Test 2: User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

Expected Response (201):
```json
{
  "statusCode": 201,
  "data": {
    "id": "user_id",
    "name": "Test User",
    "email": "testuser@example.com"
  },
  "message": "User created successfully"
}
```

---

### Test 3: User Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

Expected Response (200):
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "user_id",
      "name": "Test User",
      "email": "testuser@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**SAVE THIS TOKEN** - you'll need it for all remaining tests.

---

### Test 4: Upload PDF Document

Create a test PDF file first. You can use any PDF or create a simple one.

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@C:\path\to\sample.pdf"
```

Expected Response (201):
```json
{
  "statusCode": 201,
  "data": {
    "id": "doc_id_1",
    "filename": "sample.pdf",
    "fileType": "pdf",
    "status": "processing",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Document uploaded successfully and is being processed"
}
```

**IMPORTANT**: The document status is `processing`. The system is extracting text, creating chunks, and generating embeddings in the background.

**Wait 30-60 seconds for processing to complete.**

---

### Test 5: Upload DOCX Document

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@C:\path\to\sample.docx"
```

Expected Response (201): Similar to Test 4

---

### Test 6: Upload TXT Document

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@C:\path\to\sample.txt"
```

Expected Response (201): Similar to Test 4

---

### Test 7: List User's Documents

Wait at least 30-60 seconds after upload to allow processing.

```bash
curl -X GET http://localhost:3001/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response (200):
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "doc_id_1",
      "filename": "sample.pdf",
      "fileType": "pdf",
      "status": "ready",
      "pageCount": 5,
      "chunkCount": 12,
      "embeddedChunkCount": 12,
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "doc_id_2",
      "filename": "sample.docx",
      "fileType": "docx",
      "status": "ready",
      "pageCount": 1,
      "chunkCount": 8,
      "embeddedChunkCount": 8,
      "uploadedAt": "2024-01-15T10:32:00.000Z"
    }
  ],
  "message": "Documents retrieved successfully"
}
```

**VERIFY**: 
- Status is "ready" (not "processing")
- chunkCount matches embeddedChunkCount (all chunks have embeddings)

---

### Test 8: Get Document Details

```bash
curl -X GET http://localhost:3001/api/documents/doc_id_1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response (200):
```json
{
  "statusCode": 200,
  "data": {
    "_id": "doc_id_1",
    "filename": "sample.pdf",
    "fileType": "pdf",
    "status": "ready",
    "pageCount": 5,
    "chunkCount": 12,
    "embeddedChunkCount": 12,
    "chunks": [
      {
        "_id": "chunk_id_1",
        "chunkIndex": 0,
        "text": "Introduction to machine learning. Machine learning is a subset of artificial intelligence...",
        "tokenCount": 487,
        "embeddingStatus": "completed"
      },
      {
        "_id": "chunk_id_2",
        "chunkIndex": 1,
        "text": "...continued text with 50-token overlap from previous chunk...",
        "tokenCount": 512,
        "embeddingStatus": "completed"
      }
    ],
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Document retrieved successfully"
}
```

---

### Test 9: Semantic Search (All Documents)

```bash
curl -X POST http://localhost:3001/api/documents/search \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "topK": 5
  }'
```

Expected Response (200):
```json
{
  "statusCode": 200,
  "data": {
    "query": "What is machine learning?",
    "results": [
      {
        "_id": "chunk_id_1",
        "chunkIndex": 0,
        "text": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve...",
        "tokenCount": 500,
        "document": {
          "_id": "doc_id_1",
          "filename": "sample.pdf"
        },
        "similarity": 0.92
      },
      {
        "_id": "chunk_id_5",
        "chunkIndex": 4,
        "text": "Types of machine learning: supervised learning, unsupervised learning, reinforcement learning...",
        "tokenCount": 490,
        "document": {
          "_id": "doc_id_1",
          "filename": "sample.pdf"
        },
        "similarity": 0.87
      }
    ],
    "totalResults": 2,
    "documentId": null
  },
  "message": "Search completed successfully"
}
```

**VERIFY**:
- Results are sorted by similarity (highest first)
- Similarity scores are between 0-1
- Relevant chunks are returned

---

### Test 10: Semantic Search (Specific Document)

```bash
curl -X POST http://localhost:3001/api/documents/search \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "neural networks",
    "documentId": "doc_id_1",
    "topK": 3
  }'
```

Expected Response (200): Similar to Test 9 but filtered to specific document

---

### Test 11: Get Document Statistics

```bash
curl -X GET http://localhost:3001/api/documents/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response (200):
```json
{
  "statusCode": 200,
  "data": {
    "totalDocuments": 3,
    "processingCount": 0,
    "readyCount": 3,
    "failedCount": 0,
    "totalChunks": 28,
    "embeddedChunks": 28,
    "totalSize": 2457600
  },
  "message": "Document statistics retrieved successfully"
}
```

---

### Test 12: Delete Document

```bash
curl -X DELETE http://localhost:3001/api/documents/doc_id_1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response (200):
```json
{
  "statusCode": 200,
  "message": "Document deleted successfully"
}
```

**VERIFY**: 
- Verify in MongoDB that document and all its chunks are deleted
- File is deleted from `C:\Users\Shahid computers\Downloads`

---

### Test 13: Retry Failed Embedding

(This test requires a chunk that failed to embed, which may not happen in normal flow)

```bash
curl -X POST http://localhost:3001/api/documents/search/retry/chunk_id_that_failed \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response (200):
```json
{
  "statusCode": 200,
  "message": "Chunk embedding retried successfully"
}
```

---

## Troubleshooting

### Issue: Document Status Stuck in "processing"
**Solution**:
1. Check server logs for errors
2. Verify GOOGLE_GEMINI_API_KEY is correct
3. Check if Gemini API is initialized in server logs
4. Restart server and upload file again

### Issue: Empty Search Results
**Possible Causes**:
- Document status is not "ready" yet (wait longer)
- Embeddings failed (check chunk embeddingStatus)
- Query is too different from document content

**Solution**:
1. Verify document status is "ready": `GET /api/documents`
2. Check chunk details: `GET /api/documents/:id`
3. Verify embeddingStatus is "completed" for all chunks
4. Try different search queries

### Issue: 401 Unauthorized
**Solution**:
- Verify token is still valid
- Re-login and get fresh token
- Ensure Bearer token format: `Authorization: Bearer <token>`

### Issue: File Upload Fails
**Possible Causes**:
- File size > 25 MB
- File type not supported (only PDF, DOCX, TXT)
- No write permissions on Downloads folder

**Solution**:
1. Check file size
2. Verify file format
3. Check folder permissions

## Success Criteria

✅ All 13 tests pass
✅ Documents progress from "processing" to "ready"
✅ All chunks have embeddings
✅ Semantic search returns relevant results (similarity > 0.7)
✅ Delete cascades to chunks and removes files
✅ Error handling works (bad token, missing fields, etc.)

## Manual Testing with Postman

Import the endpoints into Postman:
1. Create collection "Cortex AI - Document Processing"
2. Add all test requests above
3. Set up environment variables:
   - `base_url`: http://localhost:3001
   - `token`: (set after login test)
4. Run requests in sequence

## Next Steps

Once testing is complete and all tests pass:
1. Commit code to git
2. Push to GitHub
3. Begin Week 5: Chatbot Integration
