const express = require('express');
const authenticateToken = require('../middleware/auth');
const { semanticSearch, retryChunkEmbedding } = require('../controllers/search.controller');

const router = express.Router();

// Semantic search
router.post('/', authenticateToken, semanticSearch);

// Retry failed embedding
router.post('/retry/:chunkId', authenticateToken, retryChunkEmbedding);

module.exports = router;
