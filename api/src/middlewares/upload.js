'use strict';

const multer = require('multer');
const { AppError } = require('../utils/AppError');

// Armazenar na memória com limite de 10MB
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const extRegex = /\.(xlsx|xls|csv)$/i;
    if (!file.originalname.match(extRegex)) {
      return cb(new AppError('Formato inválido. Apenas arquivos .xlsx, .xls e .csv são permitidos.', 400));
    }
    cb(null, true);
  }
});

module.exports = { upload };
