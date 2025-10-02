// File validation utilities

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const SUPPORTED_FORMATS = {
  'application/pdf': {
    extensions: ['.pdf'],
    category: 'document',
    outputFormats: ['docx', 'txt']
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['.docx'],
    category: 'document',
    outputFormats: ['pdf', 'txt']
  },
  'application/msword': {
    extensions: ['.doc'],
    category: 'document',
    outputFormats: ['pdf', 'docx', 'txt']
  },
  'text/plain': {
    extensions: ['.txt'],
    category: 'document',
    outputFormats: ['pdf', 'docx']
  },
  'image/jpeg': {
    extensions: ['.jpg', '.jpeg'],
    category: 'image',
    outputFormats: ['png', 'gif']
  },
  'image/png': {
    extensions: ['.png'],
    category: 'image',
    outputFormats: ['jpg', 'gif']
  },
  'image/gif': {
    extensions: ['.gif'],
    category: 'image',
    outputFormats: ['jpg', 'png']
  },
  'audio/mpeg': {
    extensions: ['.mp3'],
    category: 'audio',
    outputFormats: ['wav']
  },
  'audio/wav': {
    extensions: ['.wav'],
    category: 'audio',
    outputFormats: ['mp3']
  },
  'video/mp4': {
    extensions: ['.mp4'],
    category: 'video',
    outputFormats: ['avi']
  },
  'video/avi': {
    extensions: ['.avi'],
    category: 'video',
    outputFormats: ['mp4']
  }
};

export class FileValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'FileValidationError';
    this.code = code;
  }
}

export function validateFile(file) {
  if (!file) {
    throw new FileValidationError('No file provided', 'NO_FILE');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError(
      `File size (${formatFileSize(file.size)}) exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`,
      'FILE_TOO_LARGE'
    );
  }

  // Check if file size is 0
  if (file.size === 0) {
    throw new FileValidationError('File is empty', 'EMPTY_FILE');
  }

  // Check MIME type
  if (!SUPPORTED_FORMATS[file.type]) {
    throw new FileValidationError(
      `File type '${file.type}' is not supported. Supported types: ${Object.keys(SUPPORTED_FORMATS).join(', ')}`,
      'UNSUPPORTED_TYPE'
    );
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  const supportedExtensions = SUPPORTED_FORMATS[file.type].extensions;
  
  if (!supportedExtensions.includes(extension)) {
    throw new FileValidationError(
      `File extension '${extension}' doesn't match the detected type '${file.type}'`,
      'EXTENSION_MISMATCH'
    );
  }

  return true;
}

export function validateConversion(file, outputFormat) {
  validateFile(file);

  if (!outputFormat) {
    throw new FileValidationError('Output format is required', 'NO_OUTPUT_FORMAT');
  }

  const fileFormat = SUPPORTED_FORMATS[file.type];
  if (!fileFormat.outputFormats.includes(outputFormat.toLowerCase())) {
    throw new FileValidationError(
      `Cannot convert ${file.type} to ${outputFormat}. Supported output formats: ${fileFormat.outputFormats.join(', ')}`,
      'INVALID_CONVERSION'
    );
  }

  return true;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileCategory(mimeType) {
  return SUPPORTED_FORMATS[mimeType]?.category || 'unknown';
}

export function getOutputFormats(mimeType) {
  return SUPPORTED_FORMATS[mimeType]?.outputFormats || [];
}

export function getSupportedMimeTypes() {
  return Object.keys(SUPPORTED_FORMATS);
}

export function getDropzoneAccept() {
  const accept = {};
  Object.entries(SUPPORTED_FORMATS).forEach(([mimeType, config]) => {
    accept[mimeType] = config.extensions;
  });
  return accept;
}