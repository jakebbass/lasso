# Sentry Crash Tracking for Lasso Dairy Mobile App

This document provides information about the Sentry crash tracking implementation in the Lasso Dairy mobile app and how to use it to debug crashes like the one shown in the stack trace.

## Overview

The app has been configured with enhanced Sentry error tracking to capture both JavaScript and native (iOS/Android) crashes. This allows the team to:

1. Track errors in production builds
2. Analyze crash reports with detailed context
3. Monitor app health and stability
4. Identify problematic code sections
5. Get alerted about critical issues affecting users

## Configuration

The Sentry integration is configured in several key files:

- `src/utils/sentryConfig.js` - Core Sentry configuration and utility functions
- `app.config.js` - Expo/Sentry plugin configuration for native crashes
- `App.js` - Global error handling setup
- `src/utils/testSentry.js` - Testing utilities for Sentry
- `src/screens/debug/SentryDebugScreen.js` - Debug console for development builds

## How to Debug a Crash

When you encounter a crash similar to the one shown in the screenshot (with a stack trace like `_dispatch_call_block_and_release`), follow these steps:

1. **Check Sentry Dashboard** - Log into the Sentry dashboard to view the crash details:
   - https://lasso-milk-and-creamery-llc.sentry.io/
   - Look for the latest crash events, especially ones from the same iOS version or device type

2. **Analyze the Stack Trace** - The crash in the screenshot shows an iOS native crash:
   - The `_dispatch` functions are part of iOS's Grand Central Dispatch system
   - The presence of `UIApplication` and `CFRunLoop` indicate it's happening in the UI thread
   - This type of stack often appears with memory management issues (accessing freed memory) or thread safety issues

3. **Look for Context** - The Sentry dashboard will show:
   - Device information (iOS version, device model)
   - App state when the crash occurred
   - User information (if available)
   - Breadcrumbs showing what happened before the crash

4. **Investigate Common Causes** for iOS Native Crashes:
   - Accessing deallocated objects
   - Thread-unsafe operations
   - Excessive memory usage
   - Native module issues
   - React Native bridge problems

5. **Reproduce the Issue** - Use the Debug screen to:
   - Test in similar conditions (device, OS version)
   - Follow the same steps that led to the crash
   - Use the Sentry debugging tools to capture more context

## Testing Sentry Integration

In development builds, a Debug tab is available with tools to test the Sentry integration:

1. Navigate to the Debug tab in the app
2. Use the provided test actions to trigger different types of errors
3. Check the Sentry dashboard to verify events are being captured
4. Use the "Test Native Crash" option to validate native crash reporting

For programmatic testing, you can import from the test utilities:

```javascript
import { triggerTestError } from '../utils/testSentry';

// In a button handler or effect
triggerTestError('handled'); // or 'unhandled', 'native', 'promise', 'custom'
```

## Best Practices for Error Handling

1. **Use the `reportError` Function**:
   ```javascript
   import { reportError } from '../utils/sentryConfig';
   
   try {
     // Risky code
   } catch (error) {
     reportError(error, { screen: 'MyScreen', action: 'fetchData' });
   }
   ```

2. **Wrap Critical Functions**:
   ```javascript
   import { withErrorBoundary } from '../utils/sentryConfig';
   
   const safeFetch = withErrorBoundary(fetchData, {
     name: 'fetchDataFunction',
     fallback: { success: false, data: null }
   });
   ```

3. **Add Breadcrumbs** for better debugging:
   ```javascript
   import * as Sentry from 'sentry-expo';
   
   // Before important operations
   Sentry.addBreadcrumb({
     category: 'navigation',
     message: 'User navigated to checkout',
     level: 'info'
   });
   ```

## Handling Native Crashes

Native crashes like the one in the screenshot are now captured with:

1. **Symbolicated Stack Traces** - The raw addresses are converted to meaningful function names
2. **Device Context** - OS version, device model, memory usage
3. **App State** - What screen was active, what operations were in progress

When debugging native crashes:

1. Look for patterns (specific devices, OS versions, or user actions)
2. Check if third-party native modules are involved (they often cause native crashes)
3. Look for memory pressure indicators before the crash
4. Consider using Xcode Instruments for deeper investigation if crashes are reproducible

## Environment-Specific Behavior

The Sentry configuration changes based on the environment:

- **Development**: Enhanced debugging, more verbose logging, all events visible in console
- **Production**: Optimized performance, filtered events to reduce noise, only important events sent to Sentry

## Updating Sentry Configuration

If you need to modify the Sentry configuration:

1. Update the appropriate DSN in `.env.production` for production builds
2. Modify `app.config.js` for plugin configuration changes
3. Update `sentryConfig.js` for core behavior changes

After any configuration changes, be sure to test the integration using the Debug screen before deploying.

## Related Documentation

- [Sentry Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry + Expo Documentation](https://docs.expo.dev/guides/using-sentry/)
- [React Native Crash Reporting Best Practices](https://reactnative.dev/docs/debugging)
