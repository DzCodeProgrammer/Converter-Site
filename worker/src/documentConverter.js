/**
 * Specialized conversion utilities for document formats
 * Handles text extraction, document parsing, and format-specific optimizations
 */

const fs = require('fs');
const path = require('path');
const child = require('child_process');

class DocumentConverter {
  constructor(jobId, updateProgressCallback) {
    this.jobId = jobId;
    this.updateProgress = updateProgressCallback;
  }

  /**
   * Convert PDF to text using built-in tools or external utilities
   */
  async pdfToText(inputPath, outputPath) {
    try {
      // Try pdftotext first (part of poppler-utils), fallback to other methods
      await this.executeCommand('pdftotext', [inputPath, outputPath]);
    } catch (err) {
      console.log('pdftotext not available, trying alternative method...');
      // Fallback: use LibreOffice to convert PDF to text
      const tempDir = path.dirname(outputPath);
      await this.executeCommand(process.env.LIBREOFFICE_PATH || 'soffice', [
        '--headless',
        '--convert-to', 'txt',
        '--outdir', tempDir,
        inputPath
      ]);
      
      // Find and rename the output file
      const baseName = path.basename(inputPath, '.pdf');
      const libreOfficeOutput = path.join(tempDir, `${baseName}.txt`);
      if (fs.existsSync(libreOfficeOutput) && libreOfficeOutput !== outputPath) {
        fs.renameSync(libreOfficeOutput, outputPath);
      }
    }
  }

  /**
   * Convert DOCX to other formats
   */
  async docxConvert(inputPath, outputPath, format) {
    const tempDir = path.dirname(outputPath);
    
    if (format === 'txt') {
      // For text extraction, we might want to preserve formatting better
      await this.executeCommand(process.env.LIBREOFFICE_PATH || 'soffice', [
        '--headless',
        '--convert-to', 'txt:Text (encoded):UTF8',
        '--outdir', tempDir,
        inputPath
      ]);
    } else {
      // For other formats (PDF, etc.)
      await this.executeCommand(process.env.LIBREOFFICE_PATH || 'soffice', [
        '--headless',
        '--convert-to', format,
        '--outdir', tempDir,
        inputPath
      ]);
    }
    
    // Find and rename the output file
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const libreOfficeOutput = path.join(tempDir, `${baseName}.${format}`);
    if (fs.existsSync(libreOfficeOutput) && libreOfficeOutput !== outputPath) {
      fs.renameSync(libreOfficeOutput, outputPath);
    }
  }

  /**
   * Convert text files to other formats
   */
  async textConvert(inputPath, outputPath, format) {
    const tempDir = path.dirname(outputPath);
    
    if (format === 'pdf') {
      // Convert text to PDF using LibreOffice
      await this.executeCommand(process.env.LIBREOFFICE_PATH || 'soffice', [
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', tempDir,
        inputPath
      ]);
      
      const baseName = path.basename(inputPath, '.txt');
      const libreOfficeOutput = path.join(tempDir, `${baseName}.pdf`);
      if (fs.existsSync(libreOfficeOutput) && libreOfficeOutput !== outputPath) {
        fs.renameSync(libreOfficeOutput, outputPath);
      }
    } else if (format === 'docx') {
      // Convert text to DOCX using LibreOffice
      await this.executeCommand(process.env.LIBREOFFICE_PATH || 'soffice', [
        '--headless',
        '--convert-to', 'docx',
        '--outdir', tempDir,
        inputPath
      ]);
      
      const baseName = path.basename(inputPath, '.txt');
      const libreOfficeOutput = path.join(tempDir, `${baseName}.docx`);
      if (fs.existsSync(libreOfficeOutput) && libreOfficeOutput !== outputPath) {
        fs.renameSync(libreOfficeOutput, outputPath);
      }
    } else {
      // For same format or unsupported, just copy
      fs.copyFileSync(inputPath, outputPath);
    }
  }

  /**
   * Main conversion method that routes to appropriate converter
   */
  async convert(inputPath, outputPath, inputFormat, outputFormat) {
    await this.updateProgress(this.jobId, 'PROCESSING', 30);
    
    // Validate file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }
    
    // Check if conversion is needed
    if (inputFormat.toLowerCase() === outputFormat.toLowerCase()) {
      fs.copyFileSync(inputPath, outputPath);
      return;
    }
    
    await this.updateProgress(this.jobId, 'PROCESSING', 40);
    
    // Route to appropriate converter
    if (inputFormat === 'pdf' && outputFormat === 'txt') {
      await this.pdfToText(inputPath, outputPath);
    } else if (inputFormat === 'docx') {
      await this.docxConvert(inputPath, outputPath, outputFormat);
    } else if (inputFormat === 'txt') {
      await this.textConvert(inputPath, outputPath, outputFormat);
    } else {
      // Generic LibreOffice conversion
      const tempDir = path.dirname(outputPath);
      await this.executeCommand(process.env.LIBREOFFICE_PATH || 'soffice', [
        '--headless',
        '--convert-to', outputFormat,
        '--outdir', tempDir,
        inputPath
      ]);
      
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const libreOfficeOutput = path.join(tempDir, `${baseName}.${outputFormat}`);
      if (fs.existsSync(libreOfficeOutput) && libreOfficeOutput !== outputPath) {
        fs.renameSync(libreOfficeOutput, outputPath);
      }
    }
    
    await this.updateProgress(this.jobId, 'PROCESSING', 80);
    
    // Validate output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Conversion failed: output file not created`);
    }
    
    // Check if file has content
    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error(`Conversion failed: output file is empty`);
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
        reject(new Error(`Failed to start command '${command}': ${err.message}`));
      });
    });
  }
}

module.exports = DocumentConverter;