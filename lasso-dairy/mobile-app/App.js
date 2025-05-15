import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, Button, Platform, AppState, LogBox, Alert } from 'react-native';
import { COLORS } from './src/utils/theme';
import AppNavigator from './src/navigation/AppNavigator';
import AuthContext from './src/contexts/AuthContext';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import * as Sentry from 'sentry-expo';
import 'react-native-url-polyfill/auto';

// Import Supabase with error handling
let supabase, auth, users;
try {
  const supabaseModule = require('./src/services/supabaseClient');
  supabase = supabaseModule.default;
  auth = supabaseModule.auth;
  users = supabaseModule.users;
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  Alert.alert(
    'Configuration Error',
    'There was a problem loading the app configuration. Please make sure all environment variables are set correctly.',
    [{ text: 'OK' }]
  );
}

// Import Sentry utilities
import { initializeSentry, reportError, withErrorBoundary } from './src/utils/sentryConfig';

// Ignore specific warnings that might clutter logs
LogBox.ignoreLogs([
  'Constants.deviceYearClass',
  'Constants.manifest',
]);

// Log environment config for debugging
console.log('App Environment:', Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT);
console.log('Supabase URL configured:', !!Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL);
console.log('Sentry DSN configured:', !!Constants.expoConfig?.extra?.EXPO_PUBLIC_SENTRY_DSN);

// Initialize sentry
const sentryUtils = initializeSentry();

// Get current app info for crash reporting
const getAppInfo = () => ({
  appVersion: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Constants.expoConfig?.runtimeVersion || '1.0.0',
  updateId: Updates.updateId || 'none',
  jsEngine: Constants.jsEngine || 'hermes',
  environment: Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT || 'development'
});

export default function App() {
  // Error boundary for the entire app
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  
  // Track app state changes
  useEffect(() => {
    const appInfo = getAppInfo();
    
    // Record app info on startup
    sentryUtils.setTag('js_engine', appInfo.jsEngine);
    sentryUtils.setTag('expo_update_id', appInfo.updateId);
    
    // Add breadcrumb for app start
    sentryUtils.addBreadcrumb({
      category: 'app',
      message: 'App started',
      level: 'info',
      data: appInfo
    });
    
    // Monitor app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      sentryUtils.addBreadcrumb({
        category: 'app',
        message: `App state changed to ${nextAppState}`,
        level: 'info',
      });
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Handle uncaught errors globally
  useEffect(() => {
    const errorHandler = (error, isFatal) => {
      const stackTrace = error.stack || '';
      const crashData = {
        isFatal,
        name: error.name,
        message: error.message,
        stackPreview: stackTrace.split('\n').slice(0, 3).join('\n'),
        ...getAppInfo()
      };
      
      // Report to Sentry
      reportError(error, crashData, isFatal);
      
      // Update UI
      setErrorDetails(crashData);
      setHasError(true);
    };

    // Set up global error handler
    const previousHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler(errorHandler);
    
    return () => {
      // Restore previous handler on unmount
      global.ErrorUtils.setGlobalHandler(previousHandler);
    };
  }, []);
  // Authentication reducer to handle state transitions
  const [state, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            userData: action.userData,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
            userData: action.userData,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            userData: null,
          };
        case 'UPDATE_USER_DATA':
          return {
            ...prevState,
            userData: action.userData,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      userData: null,
    }
  );

  // Reset error state and attempt recovery
  const resetErrorBoundary = async () => {
    try {
      // Try to get updates if available
      if (Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT === 'production') {
        sentryUtils.addBreadcrumb({
          category: 'app',
          message: 'Checking for updates after crash',
          level: 'info'
        });
        
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
            return; // If we get here, the reload failed
          }
        } catch (updateError) {
          reportError(updateError, { action: 'check_update_after_crash' });
        }
      }
    } finally {
      // Reset the error state regardless of update success
      setHasError(false);
      setErrorDetails(null);
    }
  };

  // Error fallback component
  if (hasError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            Oops! Something went wrong
          </Text>
          
          <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#666' }}>
            The app encountered an unexpected error.
            {errorDetails?.isFatal ? ' This error forced the app to stop.' : ''}
          </Text>
          
          {errorDetails && (
            <View style={{ 
                backgroundColor: '#f8f8f8', 
                padding: 15, 
                borderRadius: 8, 
                marginBottom: 20,
                width: '100%',
                borderColor: '#ddd',
                borderWidth: 1
              }}>
              <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 }}>
                {errorDetails.name}: {errorDetails.message}
              </Text>
            </View>
          )}
          
          <Button title="Restart App" onPress={resetErrorBoundary} />
          
          <Text style={{ marginTop: 20, fontSize: 12, color: '#999', textAlign: 'center' }}>
            Version {errorDetails?.appVersion || '1.0.0'} ({errorDetails?.buildNumber || ''})
            {'\n'}
            The error has been reported to our team.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Initialize app - check if user is already authenticated
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Check for existing session
        const { session } = await auth.getSession();
        
        if (session) {
          // If session exists, get user data from Supabase
          const user = await auth.getUser();
          let userData = user.user_metadata || {};
          
          // Get additional user data from the users table if needed
          try {
            const { data: profileData, error } = await users.getProfile(user.id);
            if (!error && profileData) {
              userData = { ...userData, ...profileData };
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
          
          // Set user in Sentry for error tracking
          sentryUtils.setUserContext({ id: user.id, name: userData.name });
          
          dispatch({ 
            type: 'RESTORE_TOKEN', 
            token: session.access_token,
            userData,
          });
        } else {
          dispatch({ type: 'RESTORE_TOKEN', token: null, userData: null });
        }
      } catch (error) {
        console.error('Error restoring token:', error);
        dispatch({ type: 'RESTORE_TOKEN', token: null, userData: null });
      }
    };

    bootstrapAsync();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User has signed in
          const user = await auth.getUser();
          let userData = user.user_metadata || {};
          
          // Get additional user data from the users table if needed
          try {
            const { data: profileData, error } = await users.getProfile(user.id);
            if (!error && profileData) {
              userData = { ...userData, ...profileData };
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
          
          // Set user in Sentry for error tracking
          sentryUtils.setUserContext({ id: user.id, name: userData.name });
          
          dispatch({ 
            type: 'SIGN_IN', 
            token: session.access_token, 
            userData,
          });
        } else if (event === 'SIGNED_OUT') {
          // User has signed out
          dispatch({ type: 'SIGN_OUT' });
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Create the auth context value object
  const authContext = useMemo(
    () => ({
      signIn: async (credentials) => {
        try {
          const { data } = await auth.signIn(credentials);
          
          // No need to dispatch here as the auth state change listener will handle it
          return data;
        } catch (error) {
          throw error;
        }
      },
      signUp: async ({ email, password, userData }) => {
        try {
          await auth.signUp({ email, password, userData });
          
          // No need to dispatch here as the auth state change listener will handle it
          // on successful sign-in, which happens automatically after sign-up
          try {
            return await auth.signIn({ email, password });
          } catch (error) {
            reportError(error, { action: 'signUp' });
            throw error;
          }
        } catch (error) {
          throw error;
        }
      },
      signOut: async () => {
        try {
          await auth.signOut();
          // No need to dispatch here as the auth state change listener will handle it
          // Reset Sentry user when signing out
          sentryUtils.setUserContext(null);
        } catch (error) {
          reportError(error, { action: 'signOut' });
          throw error;
        }
      },
      updateUserData: async (newUserData) => {
        try {
          if (!state.userData || !state.userData.id) {
            throw new Error('User not authenticated');
          }
          
          const { data, error } = await users.updateProfile(
            state.userData.id,
            newUserData
          );
          
          if (error) throw error;
          
          dispatch({
            type: 'UPDATE_USER_DATA',
            userData: { ...state.userData, ...newUserData },
          });
          
          return data;
        } catch (error) {
          throw error;
        }
      },
      userData: state.userData,
    }),
    [state.userData]
  );

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={authContext}>
        <NavigationContainer>
          <StatusBar style="auto" backgroundColor={COLORS.background} />
          <AppNavigator
            isLoading={state.isLoading}
            userToken={state.userToken}
            isSignout={state.isSignout}
          />
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
