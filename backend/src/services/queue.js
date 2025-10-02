/**
 * Queue service with improved communication:
 * - If REDIS_HOST is set, this uses BullMQ (Redis) for production scaling.
 * - Otherwise it falls back to an in-process queue and spawns local worker (suitable for dev).
 * - Workers can communicate status updates back via HTTP API calls.
 */
const { Worker, Queue } = require('bullmq');
const IORedis = require('ioredis');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

const REDIS_HOST = process.env.REDIS_HOST;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

if (REDIS_HOST) {
  // Production setup with Redis
  const connection = new IORedis({ 
    host: REDIS_HOST, 
    port: process.env.REDIS_PORT || 6379,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  });
  
  const queue = new Queue('convert', { connection });
  
  async function addJob(data) {
    const job = await queue.add('convert-file', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 50, // Keep only last 50 completed jobs
      removeOnFail: 50,     // Keep only last 50 failed jobs
    });
    
    console.log(`Job added to queue: ${job.id}`);
    return job;
  }
  
  module.exports = { addJob, queue };
} else {
  // Development setup with in-memory queue
  console.log('Using in-memory queue for development');
  
  const jobDir = path.join(process.cwd(), '..', 'worker');
  
  async function addJob(data) {
    console.log(`Processing job: ${data.id}`);
    
    // Update status to PROCESSING
    try {
      await axios.put(`${BACKEND_URL}/api/convert/status/${data.id}`, {
        status: 'PROCESSING',
        progress: 0
      });
    } catch (err) {
      console.error('Failed to update job status to PROCESSING:', err.message);
    }
    
    // Spawn worker with job payload via environment variable
    const payload = Buffer.from(JSON.stringify(data)).toString('base64');
    const workerEnv = Object.assign({}, process.env, { 
      CONVERTER_JOB_BASE64: payload,
      BACKEND_URL: BACKEND_URL
    });
    
    const workerProcess = spawn('node', [path.join(jobDir, 'src', 'worker.js')], {
      env: workerEnv,
      stdio: ['ignore', 'pipe', 'pipe'] // capture stdout and stderr
    });
    
    // Log worker output
    workerProcess.stdout.on('data', (data) => {
      console.log(`Worker ${data.id} stdout: ${data.toString().trim()}`);
    });
    
    workerProcess.stderr.on('data', (data) => {
      console.error(`Worker ${data.id} stderr: ${data.toString().trim()}`);
    });
    
    workerProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Worker process exited with code ${code}`);
        // Update job status to FAILED
        axios.put(`${BACKEND_URL}/api/convert/status/${data.id}`, {
          status: 'FAILED',
          error: `Worker process exited with code ${code}`
        }).catch(err => console.error('Failed to update job status to FAILED:', err.message));
      } else {
        console.log(`Worker process completed successfully for job ${data.id}`);
      }
    });
    
    workerProcess.on('error', (err) => {
      console.error(`Worker process error for job ${data.id}:`, err);
      // Update job status to FAILED
      axios.put(`${BACKEND_URL}/api/convert/status/${data.id}`, {
        status: 'FAILED',
        error: `Worker process error: ${err.message}`
      }).catch(updateErr => console.error('Failed to update job status to FAILED:', updateErr.message));
    });
    
    return Promise.resolve();
  }
  
  module.exports = { addJob };
}
