import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/utils/theme';
import AppNavigator from './src/navigation/AppNavigator';
import AuthContext from './src/contexts/AuthContext';
import supabase, { auth, users } from './src/services/supabaseClient';
import 'react-native-url-polyfill/auto';

export default function App() {
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
        } catch (error) {
          throw error;
        }
      },
      signOut: async () => {
        try {
          await auth.signOut();
          // No need to dispatch here as the auth state change listener will handle it
        } catch (error) {
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
