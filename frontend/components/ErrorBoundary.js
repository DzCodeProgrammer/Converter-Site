import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className=\"min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4\">
          <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center\">
            <AlertTriangle className=\"w-16 h-16 text-red-500 mx-auto mb-4\" />
            <h2 className=\"text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4\">
              Something went wrong
            </h2>
            <p className=\"text-gray-600 dark:text-gray-400 mb-6\">
              We're sorry, but an unexpected error occurred. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className=\"text-left mb-6\">
                <details className=\"bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm\">
                  <summary className=\"cursor-pointer font-medium mb-2\">Error Details</summary>
                  <div className=\"text-red-600 dark:text-red-400 font-mono text-xs\">
                    {this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </div>
                </details>
              </div>
            )}
            
            <div className=\"space-y-3\">
              <button
                onClick={this.handleRetry}
                className=\"w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors\"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className=\"w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 font-medium rounded-lg transition-colors\"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;