import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';

/**
 * Initialize Sentry error tracking
 * Should be called at the entry point of the application
 */
export const initializeSentry = () => {
  // Only run error reporting in production
  const environment = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT;
  if (environment === 'production') {
    Sentry.init({
      dsn: Constants.expoConfig?.extra?.EXPO_PUBLIC_SENTRY_DSN,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000, // 30 seconds
      tracesSampleRate: 0.5, // Sample 50% of traces for performance monitoring
      enableNative: false, // Set to true after proper native initialization
      environment: environment,
      release: `lasso-dairy-mobile@${Constants.expoConfig?.version || '1.0.0'}`,
      dist: Constants.expoConfig?.runtimeVersion || Constants.expoConfig?.version || '1.0.0',
      beforeSend: (event) => {
        // Don't send users' personal data
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
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

    return {
      setUserContext,
    };
  }

  // For non-production environments, return no-op functions
  return {
    setUserContext: () => {},
  };
};

/**
 * Report an error to Sentry with additional context
 * @param {Error} error - The error to report
 * @param {Object} context - Additional context to add to the error
 */
export const reportError = (error, context = {}) => {
  try {
    if (Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT === 'production') {
      Sentry.withScope((scope) => {
        Object.keys(context).forEach((key) => {
          scope.setExtra(key, context[key]);
        });
        Sentry.captureException(error);
      });
    } else {
      console.error('Error:', error);
      console.info('Additional context:', context);
    }
  } catch (sentryError) {
    console.error('Failed to report error to Sentry:', sentryError);
    console.error('Original error:', error);
  }
};
