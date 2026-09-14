const Chunk = require('../models/Chunk');
const Document = require('../models/Document');
const { generateEmbedding } = require('./embeddings');

/**
 * Process failed chunks and attempt to generate embeddings
 * This can be run periodically or manually
 */
async function processFailedChunks() {
  try {
    // Find chunks that failed and haven't exceeded max retries
    const failedChunks = await Chunk.find({
      embeddingStatus: 'failed',
      retryCount: { $lt: 3 },
    });

    console.log(`[RETRY QUEUE] Processing ${failedChunks.length} failed chunks...`);

    let successCount = 0;
    let failCount = 0;

    for (const chunk of failedChunks) {
      try {
        // Attempt to generate embedding with retry logic
        const embedding = await generateEmbedding(chunk.text, 3, 200);

        await Chunk.findByIdAndUpdate(chunk._id, {
          embedding,
          embeddingStatus: 'completed',
          embeddingError: null,
          retryCount: chunk.retryCount + 1,
        });

        successCount++;
        console.log(`[RETRY QUEUE] Successfully reprocessed chunk ${chunk._id}`);

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        failCount++;
        console.error(`[RETRY QUEUE] Failed to reprocess chunk ${chunk._id}: ${error.message}`);

        // Update retry count and error message
        await Chunk.findByIdAndUpdate(chunk._id, {
          embeddingError: error.message,
          retryCount: chunk.retryCount + 1,
        });
      }
    }

    console.log(
      `[RETRY QUEUE] Completed: ${successCount} successful, ${failCount} failed`
    );

    return { totalProcessed: failedChunks.length, successCount, failCount };
  } catch (error) {
    console.error('[RETRY QUEUE] Error processing failed chunks:', error);
    throw error;
  }
}

/**
 * Get statistics on failed chunks
 */
async function getFailedChunkStats() {
  try {
    const failedChunks = await Chunk.aggregate([
      { $match: { embeddingStatus: 'failed' } },
      {
        $group: {
          _id: '$document',
          count: { $sum: 1 },
          avgRetryCount: { $avg: '$retryCount' },
        },
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: '_id',
          as: 'document',
        },
      },
    ]);

    return failedChunks;
  } catch (error) {
    console.error('[RETRY QUEUE] Error getting failed chunk stats:', error);
    throw error;
  }
}

/**
 * Schedule periodic retry job (can be called from cron job or task scheduler)
 */
function schedulePeriodicRetry(intervalMinutes = 30) {
  console.log(`[RETRY QUEUE] Scheduling periodic retry every ${intervalMinutes} minutes`);

  setInterval(async () => {
    try {
      await processFailedChunks();
    } catch (error) {
      console.error('[RETRY QUEUE] Scheduled retry failed:', error);
    }
  }, intervalMinutes * 60 * 1000);
}

module.exports = {
  processFailedChunks,
  getFailedChunkStats,
  schedulePeriodicRetry,
};
