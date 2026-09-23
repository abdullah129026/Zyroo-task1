# Cortex AI Backend - Setup & Configuration

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (already configured)
- Google Gemini API key

### 1. Install Dependencies
```bash
cd backend-system
npm install
```

### 2. Environment Variables
Create `.env` file with:
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb+srv://abdullahshaak_db_user:Asdzxcvb00@abdullah.4bclmmk.mongodb.net/?appName=Abdullah
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Start Server
```bash
npm start
```

Expected output:
```
[DB] MongoDB connected successfully
[SERVER] Google Gemini embeddings client initialized
[SERVER] Cortex AI API is running at http://localhost:3001
```

---

## Week 2: Authentication

### User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "password":"SecurePass123",
    "passwordConfirm":"SecurePass123"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "password":"SecurePass123"
  }'
```

Response includes `token` for authenticated requests.

### Get Current User (Protected)
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Weeks 3-4: Document Processing & Semantic Search

### Upload Document
```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample.pdf"
```

Supported formats: PDF, DOCX, TXT (max 25MB)

### List Documents
```bash
curl -X GET http://localhost:3001/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Document Details
```bash
curl -X GET http://localhost:3001/api/documents/:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Returns document with chunks and embedding status.

### Semantic Search
```bash
curl -X POST http://localhost:3001/api/documents/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "topK": 5
  }'
```

Optional: Add `"documentId": "specific_doc_id"` to search within one document.

### Get Statistics
```bash
curl -X GET http://localhost:3001/api/documents/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Document
```bash
curl -X DELETE http://localhost:3001/api/documents/:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Cascades and deletes all associated chunks and files.

### Retry Failed Embedding
```bash
curl -X POST http://localhost:3001/api/documents/search/retry/:chunkId \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## MongoDB Atlas Vector Search Setup

### Create Vector Index

1. Log into MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Select your cluster
3. Go to "Atlas Search" → "Create Index"
4. Choose "JSON Editor"
5. Use this configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "similarity": "cosine",
      "dimensions": 768
    },
    {
      "type": "filter",
      "path": "embeddingStatus"
    },
    {
      "type": "filter",
      "path": "document"
    }
  ]
}
```

6. Database: `cortex_ai`, Collection: `chunks`
7. Wait for index to be "Active" (2-5 minutes)

---

## Document Processing Pipeline

### Flow
```
Upload → Extract → Chunk → Embed → Index → Ready
```

### Status States
- `processing` - File uploaded, extracting text and creating chunks
- `ready` - All chunks embedded and indexed
- `failed` - Error during processing

### Processing Time
- Upload: Instant
- Extract text: 2-10s
- Chunking: <1s
- Embedding: 10-30s (depends on chunk count)
- **Total: 15-40s per document**

---

## Error Handling

### Common Issues

**Document stuck in "processing"**
- Check server logs for Gemini API errors
- Verify `GOOGLE_GEMINI_API_KEY` is set correctly
- Check MongoDB connection

**Empty search results**
- Verify document status is `ready` (not `processing`)
- Check chunk `embeddingStatus` is `completed`
- Try different search query

**File upload fails**
- Verify file size < 25MB
- Verify file type is PDF, DOCX, or TXT
- Check write permissions on downloads folder

**401 Unauthorized**
- Re-login and get fresh token
- Ensure Bearer token format: `Authorization: Bearer <token>`

### Retry Logic
- Embeddings fail? Automatic retry with exponential backoff (3 attempts max)
- Manual retry available via `/search/retry/:chunkId` endpoint
- Max 3 retries before marked as permanent failure

---

## Project Structure

```
cortex-ai-backend/
├── models/                 # Mongoose schemas
│   ├── User.js
│   ├── Document.js
│   └── Chunk.js
├── controllers/            # Request handlers
│   ├── auth.controller.js
│   ├── document.controller.js
│   └── search.controller.js
├── routes/                 # API routes
│   ├── health.routes.js
│   ├── auth.routes.js
│   ├── document.routes.js
│   └── search.routes.js
├── services/               # Business logic
│   ├── textExtraction.js
│   ├── chunking.js
│   ├── embeddings.js
│   └── retryQueue.js
├── middleware/             # Custom middleware
│   ├── auth.js
│   ├── error-handler.js
│   ├── request-logger.js
│   └── upload.js
├── config/                 # Configuration
│   ├── db.js
│   └── cors.js
├── app.js                  # Express setup
├── server.js               # Entry point
├── package.json
└── .env                    # Environment variables
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| multer | File uploads |
| pdf-parse | PDF text extraction |
| mammoth | DOCX text extraction |
| @google/generative-ai | Google Gemini API |
| dotenv | Environment variables |
| cors | Cross-origin requests |

---

## Testing

Run automated tests:
```bash
powershell -ExecutionPolicy Bypass -File run-tests.ps1
```

Manual test steps in `TESTING_GUIDE.md`

---

## Performance Notes

- Document upload: Instant (saves to disk)
- Text extraction: 2-10s depending on file size
- Chunking: <1s
- Embedding generation: 10-30s (batch processing with 100ms delay)
- Semantic search: <500ms (cosine similarity)

---

## Next Steps

### Week 5: Chatbot Integration
The document processing pipeline is ready for:
- Understanding user queries via embeddings
- Searching relevant document chunks
- Providing context to LLM
- Building conversational interface

---

## Support

For issues or questions, check:
1. Server logs (terminal output)
2. MongoDB Atlas dashboard
3. Google Gemini API console
4. Error messages in API responses

All errors include status codes and descriptive messages for debugging.
