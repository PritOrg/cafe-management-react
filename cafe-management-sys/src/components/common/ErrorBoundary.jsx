import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Stack,
  Chip
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  ExpandMore,
  ExpandLess,
  BugReport,
  Home,
  ContentCopy
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Optional: Send error to your error tracking service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In a real app, you would send this to your error tracking service
    // like Sentry, LogRocket, or Bugsnag
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // For now, just log to console
    console.error('Error logged:', errorData);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: prevState.retryCount + 1
    }));
  }

  handleToggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  }

  handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}\n\nComponent Stack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText).then(() => {
      // Could show a toast notification here
      console.log('Error details copied to clipboard');
    });
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // If provided, call the onReset prop
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  handleReportError = () => {
    // Implement error reporting functionality
    const errorDetails = {
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    console.log('Error report details:', errorDetails);
    // In a real app, you would send this to your error tracking service
    
    alert('Error report sent. Thank you for helping us improve!');
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid #f0f0f0'
            }}
          >
            <ErrorOutline color="error" sx={{ fontSize: 60, mb: 2 }} />
            
            <Typography variant="h4" component="h1" gutterBottom color="error.main">
              Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              We apologize for the inconvenience. The application has encountered an unexpected error.
            </Typography>
            
            {this.props.showDetails && this.state.error && (
              <Box 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Refresh />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={this.handleReportError}
              >
                Report Error
              </Button>
              
              {this.props.resetRoute && (
                <Button 
                  variant="text" 
                  color="primary" 
                  onClick={() => window.location.href = this.props.resetRoute}
                >
                  Go to Home
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;