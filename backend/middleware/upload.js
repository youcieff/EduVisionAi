const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads/videos');
const tempDir = path.join(__dirname, '../uploads/temp');
const pdfDir = path.join(__dirname, '../uploads/pdfs');
const imageDir = path.join(__dirname, '../uploads/images');
const documentDir = path.join(__dirname, '../uploads/documents');

[uploadDir, tempDir, pdfDir, imageDir, documentDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper: create unique filename
function uniqueFilename(file) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const nameWithoutExt = path.basename(file.originalname, ext);
  return `${nameWithoutExt}-${uniqueSuffix}${ext}`;
}

// ─── Video Upload ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uniqueFilename(file))
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'video/x-msvideo', 'video/x-matroska', 'video/webm'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024 },
  fileFilter
});

// ─── Document Upload (PDF, Word, Excel, PPT, Text) ────────────────
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentDir),
  filename: (req, file, cb) => cb(null, uniqueFilename(file))
});

const documentFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/rtf',
    'application/rtf',
    'text/html'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.html', '.htm'];

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type (${ext}). Supported: PDF, Word, Excel, PPT, Text, HTML`), false);
  }
};

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: documentFilter
});

// ─── Image Upload ───────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => cb(null, uniqueFilename(file))
});

const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files (JPG, PNG, WebP, GIF) are allowed.'), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for images
  fileFilter: imageFilter
});

// ─── PPTX Upload ────────────────────────────────────────
const pptxStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentDir),
  filename: (req, file, cb) => cb(null, uniqueFilename(file))
});

const pptxFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PowerPoint files (.pptx, .ppt) are allowed.'), false);
  }
};

const uploadPPTX = multer({
  storage: pptxStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for PPTX
  fileFilter: pptxFilter
});

// ─── Error Handler ──────────────────────────────────────
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File size is too large.'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: `Upload error: ${err.message}`
    });
  }
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  next();
};

module.exports = {
  upload,
  uploadDocument,
  uploadImage,
  uploadPPTX: uploadDocument, // Alias for backward compatibility if needed
  handleMulterError
};
