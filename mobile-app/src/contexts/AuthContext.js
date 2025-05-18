import React, { createContext } from 'react';

// Create the AuthContext
const AuthContext = createContext({
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  updateUserData: async () => {},
  userData: null,
});

export default AuthContext;
