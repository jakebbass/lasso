# Lasso Dairy Production Environment Setup

This document describes the production environment configuration for the Lasso Dairy application.

## Environment Files

The application uses separate environment files for development and production:

### Mobile App

- `.env` - Development environment variables
- `.env.production` - Production environment variables

### Backend

- `.env` - Development environment variables
- `.env.production` - Production environment variables

## Production Environment Variables

### Mobile App Production Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://mnqmjrftcvuimfiredvd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucW1qcmZ0Y3Z1aW1maXJlZHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMTAxMTEsImV4cCI6MjA2MjY4NjExMX0.agKidFRMELGbmA9XaIzmbDqJpQWFNIQ3K-oHCH9D8zQ
EXPO_PUBLIC_SENTRY_DSN=https://4c28d94577109ce18a24fc52a498cfcd@o4505925448876032.ingest.sentry.io/4505925498257408
EXPO_PUBLIC_SENTRY_AUTH_TOKEN=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
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_API_URL=https://api.lasodairy.com/v1
```

### Backend Production Environment Variables

```env
PORT=80
MONGODB_URI=mongodb://production-db-server:27017/lasso-dairy
JWT_SECRET=ce4a59aef6215c8c4337d9856fa9839d7bd7f5bb53e447d1
STRIPE_SECRET_KEY=sk_live_51NqG7HG94Xo9p3BnJHYt87UYqpoLIC0xOpesA
NODE_ENV=production
SENTRY_DSN=https://4c28d94577109ce18a24fc52a498cfcd@o4505925448876032.ingest.sentry.io/4505925498257408
SENTRY_AUTH_TOKEN=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
CORS_ORIGIN=https://lassodairy.com
LOG_LEVEL=info
```

## Error Tracking and Reporting

The application uses Sentry for error tracking and reporting in both the mobile app and backend.

### Mobile App Error Tracking

1. Error tracking is configured in `src/utils/sentryConfig.js`
2. Initialization occurs in `App.js`
3. Error boundary is implemented to catch and display errors gracefully
4. User information is set in Sentry when a user logs in or out
5. Environment-specific error handling ensures proper reporting in production while providing detailed logs in development

### Backend Error Tracking

1. Error tracking is configured in `config/sentry.js`
2. Integrated as middleware in Express
3. Custom error handling middleware provides appropriate error responses
4. Database connection errors are tracked
5. Graceful shutdown ensures proper error reporting

## Supabase Configuration

The mobile app uses Supabase for data storage and authentication. In production:

1. The application uses production Supabase keys
2. Authentication maintains sessions for logged-in users
3. User data is properly sanitized before being sent to Sentry

## Building for Production

### Mobile App Production Build

Use the following commands to build for production:

```bash
# Set environment to production
export APP_ENV=production

# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android
```

### Backend Production Deployment

Use the following commands to run the backend in production:

```bash
# Set environment to production
export NODE_ENV=production

# Start the server
npm start
```

## Checking Production Configuration

To verify the production configuration is working correctly:

1. Check the health endpoint: `https://api.lasodairy.com/v1/api/health`
2. Verify Sentry is receiving events from both the mobile app and backend
3. Confirm that Supabase queries are using the production database

## Security Considerations

1. JWT secrets are unique and complex in production
2. Database credentials are secured
3. Error messages are sanitized in production responses
4. User personal information is not included in error reports
5. CORS is properly configured for production domains only
