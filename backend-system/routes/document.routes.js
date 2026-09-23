const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const documentController = require('../controllers/document.controller');

/**
 * POST /api/documents
 * Upload a document (PDF, DOCX, TXT)
 */
router.post('/', authenticate, upload.single('file'), documentController.uploadDocument);

/**
 * GET /api/documents
 * Get all documents for the user
 */
router.get('/', authenticate, documentController.getUserDocuments);

/**
 * GET /api/documents/stats
 * Get document processing statistics
 */
router.get('/stats', authenticate, documentController.getDocumentStats);

/**
 * GET /api/documents/:id
 * Get single document with chunks
 */
router.get('/:id', authenticate, documentController.getDocument);

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', authenticate, documentController.deleteDocument);

module.exports = router;
