"use client";

import * as React from "react";
import { DebugDrawer } from "./analysis/debug-drawer";
import { useLogger } from "@/lib/ai/debug-logger";
import { Toaster } from "sonner";
import { useEffect } from "react";

interface DebugProviderProps {
  children: React.ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const logger = useLogger();

  // Log initial debug information
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.info('state', 'Debug mode initialized', {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        userAgent: window.navigator.userAgent
      });

      // Add unhandled error logging
      const handleError = (event: ErrorEvent) => {
        logger.error('state', 'Unhandled error', event.error, {
          message: event.message,
          filename: event.filename,
          lineNo: event.lineno,
          colNo: event.colno
        });
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        logger.error('state', 'Unhandled promise rejection', 
          event.reason instanceof Error ? event.reason : new Error(String(event.reason))
        );
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      // Log performance metrics
      const reportWebVitals = ({ name, value, id }: {
        name: string;
        value: number;
        id: string;
      }) => {
        logger.debug('ui', `Web Vital: ${name}`, {
          name,
          value,
          id
        });
      };

      // @ts-ignore - Web Vitals are available in development
      if (window.webVitals) {
        // @ts-ignore
        window.webVitals.getCLS(reportWebVitals);
        // @ts-ignore
        window.webVitals.getFID(reportWebVitals);
        // @ts-ignore
        window.webVitals.getLCP(reportWebVitals);
      }

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, [logger]);

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && <DebugDrawer />}
      <Toaster richColors closeButton position="top-center" />
    </>
  );
}