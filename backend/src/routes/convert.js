const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { uploadToStorage, getDownloadUrl } = require('../services/storage');
const { addJob } = require('../services/queue');
const { v4: uuidv4 } = require('uuid');
const { validateBody, validateFileUpload, uploadSchema, statusUpdateSchema } = require('../middleware/validation');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || '104857600') // 100MB
  }
});

let DB = {}; // simple in-memory DB for starter; for persistence use Prisma / Postgres
const router = express.Router();

// Helper function to get file extension from mimetype
function getFileExtension(mimetype) {
  const mimeMap = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'text/plain': 'txt',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'video/mp4': 'mp4',
    'video/avi': 'avi'
  };
  return mimeMap[mimetype] || 'unknown';
}

router.post('/upload', upload.single('file'), validateFileUpload, validateBody(uploadSchema), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { format } = req.body;
    if (!format) {
      return res.status(400).json({ error: 'Target format is required' });
    }
    
    const id = uuidv4();
    const inputFormat = getFileExtension(req.file.mimetype);
    const key = `inputs/${Date.now()}-${id}-${req.file.originalname}`;

    // Upload file to storage
    await uploadToStorage(key, req.file.buffer, req.file.mimetype);

    // Create conversion record in database
    const conversion = await prisma.conversion.create({
      data: {
        id,
        inputKey: key,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        inputFormat,
        outputFormat: format.toLowerCase(),
        fileSize: req.file.size,
        status: 'PENDING',
        progress: 0
      }
    });

    // Add job to queue
    await addJob({ 
      id, 
      inputKey: key, 
      format: format.toLowerCase(), 
      filename: req.file.originalname,
      inputFormat,
      fileSize: req.file.size
    });

    res.json({ id, status: 'PENDING' });
  } catch (err) {
    console.error('Upload error:', err);
    if (err.message.includes('File type')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.get('/status/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const conversion = await prisma.conversion.findUnique({
      where: { id }
    });
    
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }
    
    res.json({
      id: conversion.id,
      filename: conversion.filename,
      inputFormat: conversion.inputFormat,
      outputFormat: conversion.outputFormat,
      status: conversion.status,
      progress: conversion.progress,
      error: conversion.error,
      createdAt: conversion.createdAt,
      completedAt: conversion.completedAt
    });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const conversion = await prisma.conversion.findUnique({
      where: { id }
    });
    
    if (!conversion || conversion.status !== 'COMPLETED' || !conversion.outputKey) {
      return res.status(404).json({ error: 'File not available for download' });
    }
    
    const url = await getDownloadUrl(conversion.outputKey, 60 * 60); // 1 hour expiry
    
    // Generate a proper filename with extension
    const originalName = conversion.originalName || 'converted_file';
    const nameWithoutExt = path.basename(originalName, path.extname(originalName));
    const downloadFilename = `${nameWithoutExt}.${conversion.outputFormat}`;
    
    res.json({ 
      url, 
      filename: downloadFilename,
      originalName: conversion.originalName,
      outputFormat: conversion.outputFormat,
      fileSize: conversion.fileSize
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to update conversion status (used by worker)
router.put('/status/:id', validateBody(statusUpdateSchema), async (req, res) => {
  try {
    const id = req.params.id;
    const { status, progress, error, outputKey } = req.body;
    
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    if (progress !== undefined) updateData.progress = progress;
    if (error) updateData.error = error;
    if (outputKey) updateData.outputKey = outputKey;
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    
    const conversion = await prisma.conversion.update({
      where: { id },
      data: updateData
    });
    
    res.json({ success: true, conversion });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to list all conversions (with pagination)
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const conversions = await prisma.conversion.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.conversion.count();
    
    res.json({
      conversions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('List conversions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
