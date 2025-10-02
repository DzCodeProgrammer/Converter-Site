const Joi = require('joi');

// Validation schemas
const uploadSchema = Joi.object({
  format: Joi.string()
    .valid('pdf', 'docx', 'txt', 'jpg', 'png', 'mp3', 'mp4', 'wav')
    .required()
    .messages({
      'any.only': 'Output format must be one of: pdf, docx, txt, jpg, png, mp3, mp4, wav',
      'any.required': 'Output format is required'
    })
});

const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
    .required(),
  progress: Joi.number().integer().min(0).max(100).optional(),
  error: Joi.string().optional(),
  outputKey: Joi.string().optional()
});

// Middleware function to validate request body
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }

    req.body = value;
    next();
  };
};

// File validation middleware
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const maxSize = 100 * 1024 * 1024; // 100MB
  if (req.file.size > maxSize) {
    return res.status(400).json({ error: 'File size exceeds 100MB limit' });
  }

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'video/mp4'
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: `File type ${req.file.mimetype} is not supported`,
      supportedTypes: allowedMimeTypes
    });
  }

  next();
};

module.exports = {
  uploadSchema,
  statusUpdateSchema,
  validateBody,
  validateFileUpload
};