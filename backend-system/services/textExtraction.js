const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from different file types
 * @param {string} filePath - Full path to the file
 * @param {string} fileType - Type of file (pdf, docx, txt)
 * @returns {Promise<Object>} - { text, pageCount }
 */
async function extractText(filePath, fileType) {
  try {
    let text = '';
    let pageCount = 0;

    if (fileType === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      pageCount = data.numpages;
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
      pageCount = 1; // DOCX doesn't have page count in same way, estimate as 1
    } else if (fileType === 'txt') {
      text = fs.readFileSync(filePath, 'utf-8');
      pageCount = 1;
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Clean up text: remove extra whitespace, normalize line breaks
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\n+/g, '\n')
      .trim();

    return { text, pageCount };
  } catch (error) {
    throw new Error(`Text extraction failed for ${filePath}: ${error.message}`);
  }
}

module.exports = {
  extractText,
};
