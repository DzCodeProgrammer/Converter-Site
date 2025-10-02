const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const MODE = process.env.STORAGE_MODE || 'local';
const LOCAL_PATH = process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), '..', 'uploads');

if (MODE === 'local') {
  if (!fs.existsSync(LOCAL_PATH)) fs.mkdirSync(LOCAL_PATH, { recursive: true });
}

let s3;
if (MODE === 's3') {
  s3 = new AWS.S3({
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    region: process.env.S3_REGION,
  });
}

async function uploadToStorage(key, buffer, contentType) {
  if (MODE === 'local') {
    const full = path.join(LOCAL_PATH, key);
    const dir = path.dirname(full);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(full, buffer);
    return { key, location: full };
  } else {
    await s3.putObject({ Bucket: process.env.S3_BUCKET, Key: key, Body: buffer, ContentType: contentType || 'application/octet-stream' }).promise();
    return { key };
  }
}

async function downloadToLocal(tempPath, key) {
  if (MODE === 'local') {
    const full = path.join(LOCAL_PATH, key);
    fs.copyFileSync(full, tempPath);
    return tempPath;
  } else {
    const resp = await s3.getObject({ Bucket: process.env.S3_BUCKET, Key: key }).promise();
    fs.writeFileSync(tempPath, resp.Body);
    return tempPath;
  }
}

async function uploadFromPath(key, filePath) {
  if (MODE === 'local') {
    const dest = path.join(LOCAL_PATH, key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(filePath, dest);
    return { key, location: dest };
  } else {
    const stream = fs.createReadStream(filePath);
    await s3.upload({ Bucket: process.env.S3_BUCKET, Key: key, Body: stream }).promise();
    return { key };
  }
}

async function getDownloadUrl(key, expiresSeconds=3600) {
  if (MODE === 'local') {
    // For local mode, return a URL that points to our static file server
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return `${baseUrl}/files/${key}`;
  } else {
    return s3.getSignedUrlPromise('getObject', { Bucket: process.env.S3_BUCKET, Key: key, Expires: expiresSeconds });
  }
}

module.exports = { uploadToStorage, downloadToLocal, uploadFromPath, getDownloadUrl };
