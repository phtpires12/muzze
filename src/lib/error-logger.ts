import { supabase } from "@/integrations/supabase/client";

interface ErrorLogPayload {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  context?: Record<string, any>;
}

/**
 * Logs an error to the analytics_events table in Supabase.
 * Works outside of React component context (e.g., in ErrorBoundary class components).
 */
export const logError = async (
  errorType: string,
  payload: ErrorLogPayload
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const enrichedPayload: ErrorLogPayload = {
      ...payload,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event: `error:${errorType}`,
      payload: enrichedPayload as Record<string, any>,
    });

    console.log(`[ErrorLogger] Error logged: ${errorType}`);
  } catch (loggingError) {
    // Fail silently to avoid infinite loops
    console.error("[ErrorLogger] Failed to log error:", loggingError);
  }
};

/**
 * Logs a React ErrorBoundary error with component stack trace.
 */
export const logReactError = async (
  error: Error,
  componentStack?: string
): Promise<void> => {
  await logError("react_crash", {
    message: error.message,
    stack: error.stack,
    componentStack,
  });
};

/**
 * Logs an unhandled promise rejection.
 */
export const logUnhandledRejection = async (
  reason: any
): Promise<void> => {
  await logError("unhandled_rejection", {
    message: reason?.message || String(reason),
    stack: reason?.stack,
  });
};

/**
 * Logs a generic JavaScript error.
 */
export const logJavaScriptError = async (
  error: Error | string,
  context?: Record<string, any>
): Promise<void> => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  await logError("javascript_error", {
    message: errorObj.message,
    stack: errorObj.stack,
    context,
  });
};

/**
 * Sets up global error handlers for unhandled errors and rejections.
 * Call this once at app initialization.
 */
export const setupGlobalErrorHandlers = (): void => {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logUnhandledRejection(event.reason);
  });

  // Handle global JavaScript errors
  window.addEventListener("error", (event) => {
    logJavaScriptError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  console.log("[ErrorLogger] Global error handlers initialized");
};
