import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Download, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

function getStatusIcon(status) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className=\"w-5 h-5 text-green-500\" />;
    case 'FAILED':
      return <AlertCircle className=\"w-5 h-5 text-red-500\" />;
    case 'PROCESSING':
      return <Loader2 className=\"w-5 h-5 text-blue-500 animate-spin\" />;
    default:
      return <Clock className=\"w-5 h-5 text-gray-400\" />;
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
    case 'FAILED':
      return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30';
    case 'PROCESSING':
      return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30';
    default:
      return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700';
  }
}

export default function ConversionHistory({ refreshTrigger }) {
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className=\"bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6\">
      <h2 className=\"text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4\">
        Conversion History
      </h2>
      <div className=\"text-center py-8\">
        <Clock className=\"w-12 h-12 text-gray-400 mx-auto mb-4\" />
        <p className=\"text-gray-500 dark:text-gray-400\">
          No conversions yet. Start by uploading a file!
        </p>
      </div>
    </div>
  );
}
