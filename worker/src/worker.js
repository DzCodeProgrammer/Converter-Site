/**
 * Enhanced Worker script with progress reporting
 * - Supports both CONVERTER_JOB_BASE64 (dev mode) and BullMQ (production)
 * - Reports progress back to backend API
 * - Handles multiple conversion types: document, image, audio, video
 * - Better error handling and logging
 */

require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const os = require('os');
const child = require('child_process');
const axios = require('axios');
const { downloadToLocal, uploadFromPath } = require('../../backend/src/services/storage');
const DocumentConverter = require('./documentConverter');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Progress reporting function
async function updateProgress(jobId, status, progress = null, error = null, outputKey = null) {
  try {
    const updateData = { status };
    if (progress !== null) updateData.progress = progress;
    if (error) updateData.error = error;
    if (outputKey) updateData.outputKey = outputKey;
    
    await axios.put(`${BACKEND_URL}/api/convert/status/${jobId}`, updateData);
    console.log(`Updated job ${jobId}: ${status} ${progress ? `(${progress}%)` : ''}`);
  } catch (err) {
    console.error(`Failed to update progress for job ${jobId}:`, err.message);
  }
}

// Conversion functions for different file types
class FileConverter {
  constructor(jobId) {
    this.jobId = jobId;
  }

  async convertDocument(inputPath, outputPath, inputFormat, outputFormat) {
    const docConverter = new DocumentConverter(this.jobId, updateProgress);
    await docConverter.convert(inputPath, outputPath, inputFormat, outputFormat);
    return outputPath;
  }

  async convertImage(inputPath, outputPath, inputFormat, format) {
    await updateProgress(this.jobId, 'PROCESSING', 25);
    
    const convertPath = process.env.IMAGEMAGICK_CONVERT || 'magick';
    
    try {
      await this.executeCommand(convertPath, [inputPath, outputPath]);
      await updateProgress(this.jobId, 'PROCESSING', 75);
      return outputPath;
    } catch (err) {
      throw new Error(`Image conversion failed: ${err.message}`);
    }
  }

  async convertMedia(inputPath, outputPath, inputFormat, format) {
    await updateProgress(this.jobId, 'PROCESSING', 25);
    
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    
    try {
      const args = ['-y', '-i', inputPath];
      
      // Add format-specific arguments
      if (format === 'mp3') {
        args.push('-acodec', 'mp3', '-ab', '128k');
      } else if (format === 'wav') {
        args.push('-acodec', 'pcm_s16le');
      } else if (format === 'mp4') {
        args.push('-vcodec', 'libx264', '-acodec', 'aac');
      }
      
      args.push(outputPath);
      
      await this.executeCommand(ffmpegPath, args);
      await updateProgress(this.jobId, 'PROCESSING', 75);
      return outputPath;
    } catch (err) {
      throw new Error(`Media conversion failed: ${err.message}`);
    }
  }

  async executeCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = child.spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });
      
      process.on('error', (err) => {
        reject(new Error(`Failed to start command: ${err.message}`));
      });
    });
  }

  getConverter(inputFormat, outputFormat) {
    const documentFormats = ['pdf', 'docx', 'doc', 'txt'];
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const audioFormats = ['mp3', 'wav', 'ogg'];
    const videoFormats = ['mp4', 'avi', 'mkv', 'webm'];
    
    if (documentFormats.includes(outputFormat)) {
      return this.convertDocument;
    } else if (imageFormats.includes(outputFormat)) {
      return this.convertImage;
    } else if (audioFormats.includes(outputFormat) || videoFormats.includes(outputFormat)) {
      return this.convertMedia;
    } else {
      throw new Error(`Unsupported output format: ${outputFormat}`);
    }
  }
}

async function runJob(job) {
  const { id, inputKey, format, filename, inputFormat } = job;
  console.log(`Starting conversion job ${id}: ${inputFormat} → ${format}`);
  
  const converter = new FileConverter(id);
  let tempDir;
  
  try {
    // Create temporary directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conv-'));
    const inputPath = path.join(tempDir, 'input');
    const outputPath = path.join(tempDir, `output.${format}`);
    
    // Update status to processing
    await updateProgress(id, 'PROCESSING', 10);
    
    // Download input file
    console.log(`Downloading input file: ${inputKey}`);
    await downloadToLocal(inputPath, inputKey);
    await updateProgress(id, 'PROCESSING', 20);
    
    // Perform conversion based on format
    const convertFunction = converter.getConverter(inputFormat, format);
    await convertFunction.call(converter, inputPath, outputPath, inputFormat, format);
    
    // Upload result
    await updateProgress(id, 'PROCESSING', 90);
    const outputKey = `outputs/${Date.now()}-${id}-${path.basename(filename, path.extname(filename))}.${format}`;
    
    console.log(`Uploading result to: ${outputKey}`);
    await uploadFromPath(outputKey, outputPath);
    
    // Mark as completed
    await updateProgress(id, 'COMPLETED', 100, null, outputKey);
    console.log(`Conversion completed successfully: ${id}`);
    
  } catch (err) {
    console.error(`Conversion failed for job ${id}:`, err.message);
    await updateProgress(id, 'FAILED', null, err.message);
    throw err;
  } finally {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error(`Failed to clean up temp directory: ${cleanupErr.message}`);
      }
    }
  }
}

async function main() {
  const jobPayload = process.env.CONVERTER_JOB_BASE64;
  
  if (jobPayload) {
    // Development mode: process single job from environment variable
    try {
      const job = JSON.parse(Buffer.from(jobPayload, 'base64').toString('utf8'));
      await runJob(job);
      process.exit(0);
    } catch (err) {
      console.error('Job processing failed:', err.message);
      process.exit(1);
    }
  } else {
    // Production mode: could be extended to use BullMQ worker
    console.log('Worker started in production mode');
    console.log('For BullMQ integration, implement worker here');
    
    // TODO: Implement BullMQ worker for production
    /*
    const { Worker } = require('bullmq');
    const worker = new Worker('convert', async (job) => {
      await runJob(job.data);
    }, {
      connection: new IORedis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379
      })
    });
    */
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Worker shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Worker received SIGTERM, shutting down...');
  process.exit(0);
});

main().catch(err => {
  console.error('Worker fatal error:', err);
  process.exit(1);
});
