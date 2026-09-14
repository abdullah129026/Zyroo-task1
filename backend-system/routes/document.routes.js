const express = require('express');
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../middleware/auth');
const {
  uploadDocument,
  getUserDocuments,
  getDocument,
  deleteDocument,
  getDocumentStats,
} = require('../controllers/document.controller');
const { semanticSearch, retryChunkEmbedding } = require('../controllers/search.controller');

const router = express.Router();

// Configure multer for file upload
const uploadsDir = 'C:\\Users\\Shahid computers\\Downloads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  // Only allow specific file types
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only PDF, DOCX, and TXT files are allowed.'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB limit
  },
});

// Document routes (must be before :id routes to avoid conflict)
router.post('/', authenticateToken, upload.single('file'), uploadDocument);
router.get('/', authenticateToken, getUserDocuments);
router.get('/stats', authenticateToken, getDocumentStats);
router.get('/:id', authenticateToken, getDocument);
router.delete('/:id', authenticateToken, deleteDocument);

// Search routes (separate from documents to avoid routing conflicts)
router.post('/search', authenticateToken, semanticSearch);
router.post('/search/retry/:chunkId', authenticateToken, retryChunkEmbedding);

module.exports = router;
