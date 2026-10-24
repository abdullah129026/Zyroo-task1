const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload destination: UPLOAD_DIR env var, or a project-local uploads/
// folder by default. (Previously a hardcoded Windows path from local
// development, which broke uploads on every other machine and on the
// production host.) Created on startup when missing.
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Upload size cap: bounds storage cost and abuse (override via env)
    fileSize: parseInt(process.env.MAX_UPLOAD_BYTES, 10) || 25 * 1024 * 1024,
    files: 1,
  },
});

module.exports = upload;
