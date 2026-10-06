const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireQuota } = require('../middleware/quota');
const { semanticSearch, retryChunkEmbedding } = require('../controllers/search.controller');

const router = express.Router();

// Semantic search (metered against the plan's message quota)
router.post('/', authenticate, requireQuota('messages'), semanticSearch);

// Retry failed embedding (maintenance — not metered)
router.post('/retry/:chunkId', authenticate, retryChunkEmbedding);

module.exports = router;
