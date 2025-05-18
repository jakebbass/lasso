import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Initialize Sentry error tracking
 * Should be called at the entry point of the application
 */
export const initializeSentry = () => {
  // Run error reporting in both production and development to catch issues early
  // But filter what gets sent based on environment
  const environment = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT;
  
  // Initialize regardless of environment, but with different settings
  if (environment) {
    Sentry.init({
      dsn: Constants.expoConfig?.extra?.EXPO_PUBLIC_SENTRY_DSN,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000, // 30 seconds
      tracesSampleRate: environment === 'production' ? 0.2 : 0.5, // Lower sample rate in production for cost reasons
      debug: environment !== 'production', // Enable debug mode in development
      enableNative: true, // Enable native crash reporting
      attachStacktrace: true, // Attach stack traces to all messages
      environment: environment,
      release: `lasso-dairy-mobile@${Constants.expoConfig?.version || '1.0.0'}`,
      dist: Platform.OS === 'ios' ? `ios-${Constants.expoConfig?.runtimeVersion || Constants.expoConfig?.version || '1.0.0'}` 
          : `android-${Constants.expoConfig?.runtimeVersion || Constants.expoConfig?.version || '1.0.0'}`,
      beforeSend: (event, hint) => {
        // Skip sending events in development except for fatal errors
        if (environment !== 'production' && (!hint?.originalException?.isFatal)) {
          console.log('[Sentry] Event suppressed in development:', event.exception?.values?.[0]?.type);
          return null;
        }
        
        // Don't send users' personal data
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        
        // Tag the event with device info
        event.tags = {
          ...event.tags,
          platform: Platform.OS,
          platformVersion: Platform.Version
        };
        
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && 
            ['debug', 'info'].includes(breadcrumb.level)) {
          return null;
        }
        return breadcrumb;
      },
    });
    
    // Set user information globally
    const setUserContext = (user) => {
      if (user) {
        Sentry.setUser({
          id: user.id,
          username: user.name,
        });
      } else {
        Sentry.setUser(null);
      }
    };

    // Set app context information
    Sentry.setContext("app", {
      version: Constants.expoConfig?.version || '1.0.0',
      buildNumber: Constants.expoConfig?.runtimeVersion || '1.0.0'
    });

    return {
      setUserContext,
      addBreadcrumb: (breadcrumb) => {
        Sentry.addBreadcrumb(breadcrumb);
      },
      setTag: (key, value) => {
        Sentry.setTag(key, value);
      }
    };
  }

  // For cases where the environment isn't set properly, return no-op functions
  console.warn('Sentry initialization skipped due to missing environment configuration');
  return {
    setUserContext: () => {},
    addBreadcrumb: () => {},
    setTag: () => {}
  };
};

/**
 * Report an error to Sentry with additional context
 * @param {Error} error - The error to report
 * @param {Object} context - Additional context to add to the error
 * @param {boolean} isFatal - Whether the error is fatal
 */
export const reportError = (error, context = {}, isFatal = false) => {
  try {
    // Add fatal flag to context
    const enrichedContext = {
      ...context,
      isFatal: isFatal
    };

    Sentry.withScope((scope) => {
      // Add context as extra data
      Object.keys(enrichedContext).forEach((key) => {
        scope.setExtra(key, enrichedContext[key]);
      });
      
      // Set level based on whether the error is fatal
      scope.setLevel(isFatal ? 'fatal' : 'error');
      
      // If we have a transaction, mark it as failed
      if (scope.getTransaction()) {
        scope.getTransaction().setStatus('internal_error');
      }
      
      // Capture the exception
      Sentry.captureException(error);
    });
    
    // Always log errors locally, but with different verbosity
    const environment = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT;
    if (environment !== 'production' || isFatal) {
      console.error('Error:', error);
      console.info('Context:', enrichedContext);
    }
  } catch (sentryError) {
    // Failsafe if Sentry itself errors
    console.error('Failed to report error to Sentry:', sentryError);
    console.error('Original error:', error);
  }
};

/**
 * Wrapper for native modules and third-party libraries to capture errors
 * @param {Function} fn - The function to wrap
 * @param {Object} options - Options for error reporting
 * @returns {Function} - The wrapped function
 */
export const withErrorBoundary = (fn, options = {}) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      reportError(error, { 
        source: options.name || 'unknown_function', 
        args: options.logArgs ? args : 'args_not_logged',
        ...options.context
      }, options.isFatal);
      
      // Re-throw or return fallback based on options
      if (options.rethrow !== false) {
        throw error;
      }
      
      return options.fallback;
    }
  };
};
