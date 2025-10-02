import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import toast, { Toaster } from 'react-hot-toast';
import { Upload, FileText, Image, Music, Video, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import ConversionHistory from '../components/ConversionHistory';
import { validateFile, validateConversion, getDropzoneAccept, FileValidationError } from '../utils/fileValidation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// File type configurations
const FILE_TYPES = {
  document: {
    label: 'Documents',
    icon: FileText,
    extensions: ['.pdf', '.docx', '.doc', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ],
    outputFormats: ['pdf', 'docx', 'txt']
  },
  image: {
    label: 'Images',
    icon: Image,
    extensions: ['.jpg', '.jpeg', '.png', '.gif'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    outputFormats: ['jpg', 'png', 'gif']
  },
  audio: {
    label: 'Audio',
    icon: Music,
    extensions: ['.mp3', '.wav'],
    mimeTypes: ['audio/mpeg', 'audio/wav'],
    outputFormats: ['mp3', 'wav']
  },
  video: {
    label: 'Video',
    icon: Video,
    extensions: ['.mp4', '.avi'],
    mimeTypes: ['video/mp4', 'video/avi'],
    outputFormats: ['mp4', 'avi']
  }
};

function FileUploadZone({ onFileSelect, selectedFile, isDragActive }) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejectedFile = rejectedFiles[0];
        if (rejectedFile.errors) {
          const errorMessages = rejectedFile.errors.map(err => {
            switch (err.code) {
              case 'file-too-large':
                return 'File is too large (max 100MB)';
              case 'file-invalid-type':
                return 'File type not supported';
              default:
                return err.message;
            }
          });
          toast.error(errorMessages.join(', '));
        }
        return;
      }
      
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        try {
          validateFile(file);
          onFileSelect(file);
          toast.success('File selected successfully!');
        } catch (error) {
          if (error instanceof FileValidationError) {
            toast.error(error.message);
          } else {
            toast.error('File validation failed');
          }
        }
      }
    },
    accept: getDropzoneAccept(),
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
        {
          'border-blue-400 bg-blue-50 dark:bg-blue-900/20': isDragActive,
          'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500': !isDragActive,
          'bg-gray-50 dark:bg-gray-800': !isDragActive
        }
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-4">
        <Upload className={clsx('w-12 h-12', {
          'text-blue-500': isDragActive,
          'text-gray-400': !isDragActive
        })} />
        
        {selectedFile ? (
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isDragActive ? 'Drop your file here' : 'Choose a file or drag it here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supports: PDF, DOCX, TXT, JPG, PNG, MP3, MP4, WAV (max 100MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FormatSelector({ selectedFile, selectedFormat, onFormatChange }) {
  if (!selectedFile) return null;

  // Determine file type
  const fileType = Object.entries(FILE_TYPES).find(([_, config]) => 
    config.mimeTypes.includes(selectedFile.type)
  )?.[0];

  if (!fileType) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-300">Unsupported file type</p>
      </div>
    );
  }

  const config = FILE_TYPES[fileType];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Convert to:
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {config.outputFormats.map((format) => (
          <button
            key={format}
            onClick={() => onFormatChange(format)}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              {
                'bg-blue-500 text-white': selectedFormat === format,
                'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300': selectedFormat !== format
              }
            )}
          >
            {format.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ progress, status }) {
  const getStatusColor = () => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'FAILED': return 'bg-red-500';
      case 'PROCESSING': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'PROCESSING': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {progress}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className={clsx('h-3 rounded-full transition-all duration-300', getStatusColor())}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionId, setConversionId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const resetState = () => {
    setProgress(0);
    setStatus('PENDING');
    setIsConverting(false);
    setConversionId(null);
    setDownloadUrl(null);
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setFormat('');
    resetState();
  };

  const handleFormatChange = (selectedFormat) => {
    setFormat(selectedFormat);
  };

  const startConversion = async () => {
    try {
      // Validate file and conversion
      validateConversion(file, format);
    } catch (error) {
      if (error instanceof FileValidationError) {
        toast.error(error.message);
      } else {
        toast.error('Validation failed');
      }
      return;
    }

    setIsConverting(true);
    resetState();
    setStatus('PENDING');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/convert/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const uploadProgress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(Math.min(uploadProgress, 15)); // Upload is just first 15%
        },
      });

      const { id } = response.data;
      setConversionId(id);
      setProgress(20);
      toast.success('File uploaded successfully! Starting conversion...');
      
      // Start polling for status
      pollStatus(id);
    } catch (error) {
      console.error('Upload error:', error);
      setIsConverting(false);
      setStatus('FAILED');
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Upload failed. Please try again.');
      }
    }
  };

  const pollStatus = (id) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`${BACKEND_URL}/api/convert/status/${id}`);
        const jobData = statusResponse.data;
        
        setProgress(jobData.progress || 0);
        setStatus(jobData.status);
        
        if (jobData.status === 'COMPLETED') {
          clearInterval(interval);
          setIsConverting(false);
          setProgress(100);
          toast.success('Conversion completed successfully!');
          setHistoryRefreshKey(prev => prev + 1); // Refresh history
          
          // Get download URL
          try {
            const downloadResponse = await axios.get(`${BACKEND_URL}/api/convert/download/${id}`);
            setDownloadUrl(downloadResponse.data.url);
          } catch (err) {
            console.error('Failed to get download URL:', err);
          }
        } else if (jobData.status === 'FAILED') {
          clearInterval(interval);
          setIsConverting(false);
          setStatus('FAILED');
          toast.error(jobData.error || 'Conversion failed');
        }
      } catch (error) {
        console.error('Status polling error:', error);
        // Don't clear interval on network errors, keep trying
      }
    }, 2000);
    
    // Clean up interval after 10 minutes
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  };

  const downloadFile = () => {
    if (downloadUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // If we have a proper filename, set it
      if (conversionId) {
        axios.get(`${BACKEND_URL}/api/convert/download/${conversionId}`)
          .then(response => {
            if (response.data.filename) {
              link.download = response.data.filename;
            }
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          })
          .catch(() => {
            // Fallback to simple window.open
            window.open(downloadUrl, '_blank');
          });
      } else {
        window.open(downloadUrl, '_blank');
      }
    }
  };

  const handleNewConversion = () => {
    setFile(null);
    setFormat('');
    resetState();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              File Converter
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Convert your documents, images, audio, and video files with ease
            </p>
          </div>

          {/* Main Conversion Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {!isConverting && status !== 'COMPLETED' ? (
              <div className="space-y-6">
                {/* File Upload Zone */}
                <FileUploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={file}
                  isDragActive={isDragActive}
                />

                {/* Format Selection */}
                <FormatSelector
                  selectedFile={file}
                  selectedFormat={format}
                  onFormatChange={handleFormatChange}
                />

                {/* Convert Button */}
                {file && format && (
                  <div className="flex justify-center">
                    <button
                      onClick={startConversion}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Start Conversion</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress Section */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {status === 'COMPLETED' ? 'Conversion Complete!' : 'Converting Your File...'}
                  </h3>
                  
                  {file && (
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {file.name} → {format?.toUpperCase()}
                    </p>
                  )}
                </div>

                <ProgressBar progress={progress} status={status} />

                {/* Download Section */}
                {status === 'COMPLETED' && (
                  <div className="text-center space-y-4">
                    <button
                      onClick={downloadFile}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download File</span>
                    </button>
                    
                    <button
                      onClick={handleNewConversion}
                      className="block mx-auto px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      Convert Another File
                    </button>
                  </div>
                )}

                {/* Error State */}
                {status === 'FAILED' && (
                  <div className="text-center">
                    <button
                      onClick={handleNewConversion}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(FILE_TYPES).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                  <Icon className="w-8 h-8 text-blue-500 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {config.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.extensions.join(', ')}
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* Conversion History */}
          <div className="mt-12">
            <ConversionHistory refreshTrigger={historyRefreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
