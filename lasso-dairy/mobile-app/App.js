import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import AuthContext from './src/contexts/AuthContext';
import { COLORS } from './src/utils/theme';

export default function App() {
  const [state, setState] = useState({
    isLoading: true,
    isSignout: false,
    userToken: null,
    userData: null,
  });

  useEffect(() => {
    // Fetch the token from storage then navigate to the appropriate screen
    const bootstrapAsync = async () => {
      let userToken;
      let userData;

      try {
        userToken = await AsyncStorage.getItem('userToken');
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          userData = JSON.parse(userDataString);
        }
      } catch (e) {
        // Restoring token failed
        console.log('Restoring token failed');
      }

      // After restoring token, we may need to validate it in production apps
      setState({
        ...state,
        userToken,
        userData,
        isLoading: false,
      });
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    signIn: async (data) => {
      // In a real app, you would send the data to your server for authentication
      const { token, ...userData } = data;
      
      try {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } catch (e) {
        console.log('Error saving auth data', e);
      }
      
      setState({
        ...state,
        isSignout: false,
        userToken: token,
        userData: userData,
      });
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
      } catch (e) {
        console.log('Error removing auth data', e);
      }
      
      setState({
        ...state,
        isSignout: true,
        userToken: null,
        userData: null,
      });
    },
    signUp: async (data) => {
      // In a real app, you would send the data to your server for registration
      const { token, ...userData } = data;
      
      try {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } catch (e) {
        console.log('Error saving auth data', e);
      }
      
      setState({
        ...state,
        isSignout: false,
        userToken: token,
        userData: userData,
      });
    },
    updateUserData: async (newUserData) => {
      const updatedUserData = { ...state.userData, ...newUserData };
      
      try {
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      } catch (e) {
        console.log('Error updating user data', e);
      }
      
      setState({
        ...state,
        userData: updatedUserData,
      });
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
