const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { extractText } = require('../services/textExtraction');
const { chunkText } = require('../services/chunking');
const { generateEmbedding } = require('../services/embeddings');

/**
 * Handle document upload and processing
 * POST /api/documents
 */
async function uploadDocument(req, res) {
  try {
    const { userId } = req.user;

    if (!req.file) {
      return res.status(400).json({
        statusCode: 400,
        message: 'No file provided',
      });
    }

    const file = req.file;
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

    if (!supportedTypes.includes(file.mimetype)) {
      // Clean up uploaded file if not supported
      fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: 400,
        message: 'Unsupported file type. Supported: PDF, DOCX, TXT',
      });
    }

    // Determine file type
    let fileType;
    if (file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileType = 'docx';
    } else if (file.mimetype === 'text/plain') {
      fileType = 'txt';
    }

    // Create document record
    const document = new Document({
      owner: userId,
      filename: file.originalname,
      fileType,
      filePath: file.path,
      fileSize: file.size,
      status: 'processing',
    });

    await document.save();

    // Process document asynchronously
    processDocumentAsync(document._id);

    return res.status(201).json({
      statusCode: 201,
      data: {
        id: document._id,
        filename: document.filename,
        fileType: document.fileType,
        status: document.status,
        uploadedAt: document.uploadedAt,
      },
      message: 'Document uploaded successfully and is being processed',
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      statusCode: 500,
      message: 'Failed to upload document',
      error: error.message,
    });
  }
}

/**
 * Process document: extract text, create chunks, generate embeddings
 */
async function processDocumentAsync(documentId) {
  try {
    const document = await Document.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Step 1: Extract text
    const { text, pageCount } = await extractText(document.filePath, document.fileType);

    document.pageCount = pageCount;

    // Step 2: Create chunks
    const chunks = chunkText(text);

    // Step 3: Save chunks to database and generate embeddings
    const chunkDocs = chunks.map((chunk, index) => ({
      document: documentId,
      chunkIndex: index,
      text: chunk.text,
      tokenCount: chunk.tokenCount,
      embeddingStatus: 'pending',
    }));

    const savedChunks = await Chunk.insertMany(chunkDocs);
    document.chunkCount = savedChunks.length;

    // Step 4: Generate embeddings for all chunks
    await generateChunkEmbeddings(savedChunks, documentId);

    // Update document status
    document.status = 'ready';
    await document.save();

    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);

    // Update document with error status
    try {
      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        errorMessage: error.message,
      });
    } catch (updateError) {
      console.error('Failed to update document error status:', updateError);
    }
  }
}

/**
 * Generate embeddings for all chunks of a document
 */
async function generateChunkEmbeddings(chunks, documentId) {
  let embeddedCount = 0;

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.text);

      await Chunk.findByIdAndUpdate(chunk._id, {
        embedding,
        embeddingStatus: 'completed',
      });

      embeddedCount++;

      // Add delay between API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to embed chunk ${chunk._id}:`, error);

      await Chunk.findByIdAndUpdate(chunk._id, {
        embeddingStatus: 'failed',
        embeddingError: error.message,
        retryCount: 1,
      });
    }
  }

  // Update document with embedded chunk count
  await Document.findByIdAndUpdate(documentId, {
    embeddedChunkCount: embeddedCount,
  });
}

/**
 * Get all documents for a user
 * GET /api/documents
 */
async function getUserDocuments(req, res) {
  try {
    const { userId } = req.user;

    const documents = await Document.find({ owner: userId })
      .select('_id filename fileType status pageCount chunkCount embeddedChunkCount uploadedAt')
      .sort({ uploadedAt: -1 });

    return res.status(200).json({
      statusCode: 200,
      data: documents,
      message: 'Documents retrieved successfully',
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Failed to retrieve documents',
      error: error.message,
    });
  }
}

/**
 * Get single document with chunks
 * GET /api/documents/:id
 */
async function getDocument(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const document = await Document.findOne({ _id: id, owner: userId });

    if (!document) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Document not found',
      });
    }

    const chunks = await Chunk.find({ document: id })
      .select('_id chunkIndex text tokenCount embeddingStatus')
      .sort({ chunkIndex: 1 });

    return res.status(200).json({
      statusCode: 200,
      data: {
        ...document.toObject(),
        chunks,
      },
      message: 'Document retrieved successfully',
    });
  } catch (error) {
    console.error('Get document error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Failed to retrieve document',
      error: error.message,
    });
  }
}

/**
 * Delete document and cascade-delete chunks
 * DELETE /api/documents/:id
 */
async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const document = await Document.findOne({ _id: id, owner: userId });

    if (!document) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Document not found',
      });
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete all chunks associated with document
    await Chunk.deleteMany({ document: id });

    // Delete document
    await Document.findByIdAndDelete(id);

    return res.status(200).json({
      statusCode: 200,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Failed to delete document',
      error: error.message,
    });
  }
}

/**
 * Get processing statistics for a user's documents
 * GET /api/documents/stats
 */
async function getDocumentStats(req, res) {
  try {
    const { userId } = req.user;

    const stats = await Document.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          processingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] },
          },
          readyCount: { $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalChunks: { $sum: '$chunkCount' },
          embeddedChunks: { $sum: '$embeddedChunkCount' },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    const documentStats = stats[0] || {
      totalDocuments: 0,
      processingCount: 0,
      readyCount: 0,
      failedCount: 0,
      totalChunks: 0,
      embeddedChunks: 0,
      totalSize: 0,
    };

    return res.status(200).json({
      statusCode: 200,
      data: documentStats,
      message: 'Document statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Failed to retrieve statistics',
      error: error.message,
    });
  }
}

module.exports = {
  uploadDocument,
  getUserDocuments,
  getDocument,
  deleteDocument,
  getDocumentStats,
};
