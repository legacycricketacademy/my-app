import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { Button } from './button';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error info for detailed display
    this.setState({ errorInfo });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Error display component with development details
function ErrorDisplay({ 
  error, 
  errorInfo, 
  onRetry 
}: { 
  error?: Error; 
  errorInfo?: ErrorInfo; 
  onRetry: () => void; 
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
      <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-600 mb-4 text-center">
        {error?.message || 'An unexpected error occurred'}
      </p>
      
      {isDev && errorInfo && (
        <div className="w-full mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 mb-2"
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Details
          </Button>
          {showDetails && (
            <div className="bg-gray-100 p-3 rounded text-xs font-mono text-left overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error:</strong> {error?.message}
              </div>
              <div className="mb-2">
                <strong>Stack:</strong>
                <pre className="whitespace-pre-wrap mt-1">{error?.stack}</pre>
              </div>
              <div>
                <strong>Component Stack:</strong>
                <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
              </div>
            </div>
          )}
        </div>
      )}
      
      <Button 
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Route-level error boundary
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
