const Sentry = require('@sentry/node');
require('dotenv').config();

/**
 * Initialize Sentry error tracking for the backend
 * @returns {Object} - Sentry instance
 */
const initializeSentry = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.5, // Sample 50% of transactions for performance monitoring
      environment: process.env.NODE_ENV,
      release: `lasso-dairy-backend@${process.env.npm_package_version || '1.0.0'}`,
      beforeSend: (event) => {
        // Sanitize sensitive data
        if (event.request && event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express(),
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      ],
    });

    // Return Sentry instance
    return Sentry;
  }
  
  // For non-production environments, return a mock Sentry
  return {
    Handlers: {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => next(err),
    },
    captureException: (err) => {
      console.error('Error (not sent to Sentry in non-production):', err);
    },
    captureMessage: (msg) => {
      console.log('Message (not sent to Sentry in non-production):', msg);
    },
    setUser: () => {},
    setTags: () => {},
    setContext: () => {},
  };
};

module.exports = initializeSentry();
