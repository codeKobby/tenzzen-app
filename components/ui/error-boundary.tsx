import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const DefaultFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div className="flex min-h-screen items-center justify-center p-6">
    <Alert variant="destructive" className="max-w-2xl">
      <AlertTitle>Something went wrong!</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-4">
          <p>
            An unexpected error occurred. Our team has been notified and is
            working on a fix.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 w-full overflow-auto rounded-md bg-slate-950 p-4">
              <code className="text-xs text-slate-50">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </code>
            </pre>
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={resetErrorBoundary}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  </div>
);

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback: Fallback = DefaultFallback } = this.props;

    if (error) {
      return <Fallback error={error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return children;
  }
}

export type { FallbackProps, ErrorBoundaryProps };