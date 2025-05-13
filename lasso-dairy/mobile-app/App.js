import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import AuthContext from './src/contexts/AuthContext';
import { COLORS } from './src/utils/theme';
import supabase, { auth as supabaseAuth } from './src/services/supabaseClient';

export default function App() {
  const [state, setState] = useState({
    isLoading: true,
    isSignout: false,
    userToken: null,
    userData: null,
  });

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { user, error } = await supabaseAuth.getCurrentUser();
        
        if (error) {
          console.log('Error getting session:', error.message);
          setState({
            ...state,
            isLoading: false,
          });
          return;
        }

        if (user) {
          // Fetch additional user data from the users table
          const { data: userData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.log('Error fetching user profile:', profileError.message);
          }

          setState({
            ...state,
            userToken: user.id,
            userData: userData || user,
            isLoading: false,
          });
        } else {
          setState({
            ...state,
            isLoading: false,
          });
        }
      } catch (error) {
        console.log('Session check error:', error.message);
        setState({
          ...state,
          isLoading: false,
        });
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User has signed in
          const user = session.user;
          
          // Fetch additional user data
          const { data: userData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.log('Error fetching user profile:', profileError.message);
          }

          setState({
            ...state,
            userToken: user.id,
            userData: userData || user,
            isSignout: false,
          });
        } else if (event === 'SIGNED_OUT') {
          // User has signed out
          setState({
            ...state,
            userToken: null,
            userData: null,
            isSignout: true,
          });
        }
      }
    );

    return () => {
      // Clean up the subscription when component unmounts
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const authContext = {
    signIn: async ({ email, password }) => {
      try {
        const { data, error } = await supabaseAuth.signIn(email, password);
        
        if (error) {
          console.log('Sign in error:', error.message);
          throw error;
        }
        
        // User data will be updated by the auth state change listener
        return data;
      } catch (error) {
        console.log('Sign in error:', error.message);
        throw error;
      }
    },
    
    signOut: async () => {
      try {
        const { error } = await supabaseAuth.signOut();
        
        if (error) {
          console.log('Sign out error:', error.message);
          throw error;
        }
        
        // State will be updated by the auth state change listener
      } catch (error) {
        console.log('Sign out error:', error.message);
        throw error;
      }
    },
    
    signUp: async ({ email, password, userData }) => {
      try {
        // Register user with Supabase Auth
        const { data, error } = await supabaseAuth.signUp(email, password, {
          name: userData.name,
          phone: userData.phone,
        });
        
        if (error) {
          console.log('Sign up error:', error.message);
          throw error;
        }
        
        // Create a record in the users table
        if (data.user) {
          const { error: profileError } = await supabase.from('users').insert([
            {
              id: data.user.id,
              email: email,
              name: userData.name,
              phone: userData.phone,
              street: userData.street,
              city: userData.city,
              state: userData.state,
              zip_code: userData.zipCode,
              country: userData.country || 'USA',
              role: 'customer',
            },
          ]);
          
          if (profileError) {
            console.log('Error creating user profile:', profileError.message);
            throw profileError;
          }
        }
        
        // User data will be updated by the auth state change listener
        return data;
      } catch (error) {
        console.log('Sign up error:', error.message);
        throw error;
      }
    },
    
    updateUserData: async (newUserData) => {
      try {
        if (!state.userData || !state.userData.id) {
          throw new Error('User not authenticated');
        }
        
        const userId = state.userData.id;
        
        // Update user metadata if needed
        if (newUserData.name || newUserData.phone) {
          const { error: authError } = await supabaseAuth.updateUser({
            name: newUserData.name,
            phone: newUserData.phone,
          });
          
          if (authError) {
            console.log('Error updating auth data:', authError.message);
            throw authError;
          }
        }
        
        // Update profile in users table
        const { data, error } = await supabase
          .from('users')
          .update({
            name: newUserData.name,
            phone: newUserData.phone,
            street: newUserData.street,
            city: newUserData.city,
            state: newUserData.state,
            zip_code: newUserData.zipCode,
            country: newUserData.country,
          })
          .eq('id', userId)
          .select()
          .single();
        
        if (error) {
          console.log('Error updating user profile:', error.message);
          throw error;
        }
        
        // Update local state
        setState({
          ...state,
          userData: { ...state.userData, ...data },
        });
        
        return data;
      } catch (error) {
        console.log('Update user data error:', error.message);
        throw error;
      }
    },
    
    userData: state.userData,
  };

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={authContext}>
        <StripeProvider
          publishableKey="your_stripe_publishable_key_here"
          merchantIdentifier="merchant.com.lassodairy"
        >
          <NavigationContainer>
            <StatusBar style="light" backgroundColor={COLORS.primary} />
            <AppNavigator 
              isLoading={state.isLoading}
              isSignout={state.isSignout}
              userToken={state.userToken}
            />
          </NavigationContainer>
        </StripeProvider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
