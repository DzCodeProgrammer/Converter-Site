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
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'FAILED':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'PROCESSING':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchConversions = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${BACKEND_URL}/api/convert/list`, {
        params: {
          page: pageNum,
          limit: 10
        }
      });
      
      setConversions(response.data.conversions);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch conversions:', err);
      setError('Failed to load conversion history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversions(page);
  }, [page, refreshTrigger]);

  const handleDownload = async (id, filename) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/convert/download/${id}`);
      
      if (response.data.url.startsWith('file://')) {
        alert('File is ready! Check your uploads/outputs directory for: ' + filename);
      } else {
        window.open(response.data.url, '_blank');
      }
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed. File may not be ready yet.');
    }
  };

  const handleRefresh = () => {
    fetchConversions(page);
  };

  if (loading && conversions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">Loading conversion history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Conversion History
          </h2>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {conversions.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No conversions yet. Start by uploading a file!
            </p>
          </div>
        ) : (
          conversions.map((conversion) => (
            <div key={conversion.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(conversion.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {conversion.originalName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversion.inputFormat?.toUpperCase()} → {conversion.outputFormat?.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(conversion.fileSize)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(conversion.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {conversion.status === 'PROCESSING' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${conversion.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {conversion.progress || 0}% complete
                      </p>
                    </div>
                  )}
                  
                  {conversion.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Error: {conversion.error}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversion.status)}`}>
                    {conversion.status}
                  </span>
                  
                  {conversion.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleDownload(conversion.id, conversion.originalName)}
                      className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className={`px-3 py-1 text-sm rounded border transition-colors ${
                  page <= 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
                className={`px-3 py-1 text-sm rounded border transition-colors ${
                  page >= pagination.pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}