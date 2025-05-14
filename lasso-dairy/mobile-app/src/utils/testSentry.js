/**
 * Test utilities for Sentry integration
 * Contains functions to generate test errors and verify Sentry is working correctly
 */

import * as Sentry from 'sentry-expo';
import { Alert, Platform, Button } from 'react-native';

/**
 * Simulate different types of errors to verify Sentry reporting
 * Should be used only in development
 */
export const triggerTestError = (errorType = 'handled') => {
  switch (errorType) {
    case 'handled':
      try {
        // Generate a controlled error
        const obj = null;
        obj.nonExistentMethod();
      } catch (error) {
        // Capture the error in Sentry
        Sentry.captureException(error);
        Alert.alert(
          'Test Error Sent',
          'A handled error was captured and sent to Sentry.'
        );
      }
      break;

    case 'unhandled':
      // This will trigger the global error handler
      setTimeout(() => {
        const obj = null;
        obj.nonExistentMethod();
      }, 100);
      break;

    case 'promise':
      // Create a rejected promise that isn't caught
      Promise.reject(new Error('Unhandled promise rejection test'));
      Alert.alert(
        'Promise Rejection Triggered',
        'Check Sentry for the unhandled promise rejection.'
      );
      break;
      
    case 'native':
      if (Platform.OS === 'ios') {
        // This causes a native crash on iOS
        const message = `
          Testing native iOS crash reporting.
          This will crash the app immediately.
          The next launch should send the crash report to Sentry.
        `;
        Alert.alert('Native Crash Test', message, [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Trigger Crash',
            onPress: () => {
              // This calls a non-existent Objective-C method causing a native crash
              Sentry.nativeCrash();
            },
            style: 'destructive',
          },
        ]);
      } else if (Platform.OS === 'android') {
        // This causes a native crash on Android
        const message = `
          Testing native Android crash reporting.
          This will crash the app immediately.
          The next launch should send the crash report to Sentry.
        `;
        Alert.alert('Native Crash Test', message, [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Trigger Crash',
            onPress: () => {
              // This will cause a native crash on Android
              Sentry.nativeCrash();
            },
            style: 'destructive',
          },
        ]);
      }
      break;

    case 'custom':
      // Send a custom message with context
      Sentry.captureMessage('This is a test message', {
        level: 'info',
        extra: {
          custom_details: 'Testing Sentry integration',
          timestamp: new Date().toISOString()
        },
        tags: {
          test_type: 'manual',
          environment: 'development'
        }
      });
      Alert.alert(
        'Test Message Sent',
        'A custom message was sent to Sentry.'
      );
      break;

    default:
      Alert.alert('Invalid Test Type', `Error type '${errorType}' not recognized.`);
  }
};

/**
 * A component with a button to test Sentry integration
 * For development debugging only
 * @param {Object} props - Component props
 * @returns {React.Component} A button component that can trigger test errors
 */
export const SentryTest = (props) => {
  // Import this component in a development screen to test Sentry
  const runTest = () => {
    Alert.alert(
      'Test Sentry',
      'Select an error type to test',
      [
        {
          text: 'Handled Exception',
          onPress: () => triggerTestError('handled'),
        },
        {
          text: 'Unhandled Exception',
          onPress: () => triggerTestError('unhandled'),
        },
        {
          text: 'Promise Rejection',
          onPress: () => triggerTestError('promise'),
        },
        {
          text: 'Native Crash',
          onPress: () => triggerTestError('native'),
          style: 'destructive',
        },
        {
          text: 'Custom Message',
          onPress: () => triggerTestError('custom'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <Button 
      title="Test Sentry" 
      onPress={runTest}
      color="#FF0000"
    />
  );
};
