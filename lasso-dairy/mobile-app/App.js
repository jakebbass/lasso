import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, Button } from 'react-native';
import { COLORS } from './src/utils/theme';
import AppNavigator from './src/navigation/AppNavigator';
import AuthContext from './src/contexts/AuthContext';
import supabase, { auth, users } from './src/services/supabaseClient';
import { initializeSentry, reportError } from './src/utils/sentryConfig';
import 'react-native-url-polyfill/auto';

// Initialize sentry
const sentryUtils = initializeSentry();

export default function App() {
  // Error boundary for the entire app
  const [hasError, setHasError] = useState(false);

  // Handle uncaught errors globally
  useEffect(() => {
    const errorHandler = (error, isFatal) => {
      reportError(error, { isFatal });
      setHasError(true);
    };

    // Set up global error handler
    const subscription = global.ErrorUtils.setGlobalHandler(errorHandler);
    
    return () => {
      // Clean up error handler on unmount
      global.ErrorUtils.setGlobalHandler(subscription);
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

  // Reset error state
  const resetErrorBoundary = () => {
    setHasError(false);
  };

  // Error fallback component
  if (hasError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>
            Something went wrong
          </Text>
          <Button title="Try again" onPress={resetErrorBoundary} />
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
