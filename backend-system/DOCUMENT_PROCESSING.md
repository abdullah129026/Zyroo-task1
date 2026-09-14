# Document Processing & Semantic Search Pipeline

## Overview
This document describes the complete document processing pipeline that converts uploaded files (PDF, DOCX, TXT) into searchable, semantically-aware chunks using Google Gemini embeddings and MongoDB Atlas Search.

## Architecture

### 1. Document Upload Flow
- **Endpoint**: `POST /api/documents`
- **File Types**: PDF, DOCX, TXT
- **Size Limit**: 25 MB
- **Storage**: `C:\Users\Shahid computers\Downloads`
- **Response**: Document record with status "processing"

### 2. Text Extraction
Supported formats:
- **PDF**: Uses `pdf-parse` library
- **DOCX**: Uses `mammoth` library
- **TXT**: Plain text read

### 3. Chunking Strategy
- **Chunk Size**: ~500 tokens per chunk
- **Overlap**: ~50 tokens between chunks
- **Token Counting**: Word-based estimation (1 word ≈ 1.3 tokens)
- **Splitting**: Sentence-boundary aware to preserve context

### 4. Embedding Generation
- **Service**: Google Gemini API (`embedding-001` model)
- **API Key**: `GOOGLE_GEMINI_API_KEY` in `.env`
- **Processing**: Batch processing with 100ms delay between requests
- **Storage**: Stored in Chunk document in MongoDB

### 5. Vector Search
- **Method**: Cosine similarity on embeddings
- **Query**: Text is embedded and compared against all chunk embeddings
- **Scope**: Can search all documents or specific document
- **Sorting**: Results sorted by similarity score (highest first)

## MongoDB Atlas Search Setup

### Create Vector Search Index

1. **Log into MongoDB Atlas**
   - Go to https://www.mongodb.com/cloud/atlas
   - Select your cluster

2. **Navigate to Search Indexes**
   - Click "Atlas Search" in the left sidebar
   - Click "Create Index"

3. **Create Vector Search Index**
   - Choose "JSON Editor" option
   - Use this configuration:

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

4. **Index Name**: Use default or name it `vector_search`

5. **Database & Collection**:
   - Database: `cortex_ai` (or your database name)
   - Collection: `chunks`

6. **Wait for Index Creation**
   - Status will show "Active" when ready (usually 2-5 minutes)

## API Endpoints

### Document Management

#### Upload Document
```
POST /api/documents
Content-Type: multipart/form-data

Body:
- file: <PDF/DOCX/TXT file>

Response (201):
{
  "statusCode": 201,
  "data": {
    "id": "document_id",
    "filename": "document.pdf",
    "fileType": "pdf",
    "status": "processing",
    "uploadedAt": "2024-01-01T12:00:00Z"
  },
  "message": "Document uploaded successfully and is being processed"
}
```

#### Get User's Documents
```
GET /api/documents
Authorization: Bearer <token>

Response (200):
{
  "statusCode": 200,
  "data": [
    {
      "_id": "document_id",
      "filename": "document.pdf",
      "fileType": "pdf",
      "status": "ready",
      "pageCount": 5,
      "chunkCount": 12,
      "embeddedChunkCount": 12,
      "uploadedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "message": "Documents retrieved successfully"
}
```

#### Get Single Document
```
GET /api/documents/:id
Authorization: Bearer <token>

Response (200):
{
  "statusCode": 200,
  "data": {
    "_id": "document_id",
    "filename": "document.pdf",
    "fileType": "pdf",
    "status": "ready",
    "pageCount": 5,
    "chunkCount": 12,
    "embeddedChunkCount": 12,
    "uploadedAt": "2024-01-01T12:00:00Z",
    "chunks": [
      {
        "_id": "chunk_id",
        "chunkIndex": 0,
        "text": "Chapter 1: Introduction...",
        "tokenCount": 487,
        "embeddingStatus": "completed"
      }
    ]
  },
  "message": "Document retrieved successfully"
}
```

#### Delete Document
```
DELETE /api/documents/:id
Authorization: Bearer <token>

Response (200):
{
  "statusCode": 200,
  "message": "Document deleted successfully"
}
```

### Semantic Search

#### Search Across All Documents
```
POST /api/search
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "query": "What is machine learning?",
  "topK": 5
}

Response (200):
{
  "statusCode": 200,
  "data": {
    "query": "What is machine learning?",
    "results": [
      {
        "_id": "chunk_id",
        "chunkIndex": 2,
        "text": "Machine learning is a subset of artificial intelligence...",
        "tokenCount": 450,
        "document": {
          "_id": "doc_id",
          "filename": "AI_Guide.pdf"
        },
        "similarity": 0.94
      }
    ],
    "totalResults": 1,
    "documentId": null
  },
  "message": "Search completed successfully"
}
```

#### Search Within Specific Document
```
POST /api/search
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "query": "What is machine learning?",
  "documentId": "specific_document_id",
  "topK": 10
}
```

#### Retry Failed Embedding
```
POST /api/search/retry/:chunkId
Authorization: Bearer <token>

Response (200):
{
  "statusCode": 200,
  "message": "Chunk embedding retried successfully"
}
```

## Error Handling & Retry Logic

### Embedding Failure Scenarios
1. **API Rate Limiting** → Automatic retry with exponential backoff
2. **Network Error** → Retry up to 3 times with 100ms delay
3. **Invalid Text** → Marked as failed, manual retry available
4. **Max Retries Exceeded** → Chunk remains in failed state

### Chunk Status Workflow
```
pending → completed (success)
       ↘ failed → retry (manual) → completed or failed
```

### Monitoring Failed Chunks
Query MongoDB for failed chunks:
```javascript
db.chunks.find({ embeddingStatus: "failed", retryCount: { $lt: 3 } })
```

## Environment Variables

Add to `.env`:
```
# Google Gemini API
GOOGLE_GEMINI_API_KEY=your-api-key-here

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

## Testing

### 1. Register & Login
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

### 2. Upload Document
```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@sample.pdf"
```

### 3. List Documents
```bash
curl -X GET http://localhost:3001/api/documents \
  -H "Authorization: Bearer <your_token>"
```

### 4. Semantic Search
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"search term","topK":5}'
```

## Performance Notes

- **Upload**: Instant (file saved to disk)
- **Text Extraction**: 2-10 seconds depending on file size
- **Chunking**: < 1 second
- **Embedding Generation**: 10-30 seconds (depends on chunk count and API rate limits)
- **Search**: < 500ms for cosine similarity calculation

## Troubleshooting

### Document Status Stuck in "processing"
- Check server logs for embedding errors
- Verify Google Gemini API key is valid
- Check network connectivity

### Embeddings Not Generated
- Verify `GOOGLE_GEMINI_API_KEY` is set correctly
- Check if API key has access to embedding model
- Retry failed chunks using the retry endpoint

### Search Returns No Results
- Verify document status is "ready"
- Check that chunks have `embeddingStatus: "completed"`
- Try searching with different query

### File Upload Fails
- Verify file is under 25 MB
- Check file type (PDF, DOCX, TXT only)
- Verify write permissions on `C:\Users\Shahid computers\Downloads`
