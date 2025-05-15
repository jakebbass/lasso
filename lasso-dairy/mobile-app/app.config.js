import * as dotenv from 'dotenv';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default ({ config }) => {
  // Determine which env file to use based on release channel
  const env = process.env.APP_ENV || 'development';
  const envPath = env === 'production' ? '.env.production' : '.env';
  
  // Load the appropriate env file with path
  dotenv.config({ path: envPath });
  
  // Log environment loading - helps with debugging
  console.log(`Loading ${env} environment from ${envPath}`);

  // Define variables for readability and debugging
  const EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const EXPO_PUBLIC_SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const EXPO_PUBLIC_ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT;
  const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL;
  const EXPO_PUBLIC_SENTRY_AUTH_TOKEN = process.env.EXPO_PUBLIC_SENTRY_AUTH_TOKEN;
  
  return {
    ...config,
    name: 'Lasso Dairy',
    slug: 'lasso-dairy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './src/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.lassodairy.app',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.lassodairy.app'
    },
    web: {
      favicon: './src/assets/favicon.png'
    },
    extra: {
      // Make environment variables available at runtime
      EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_SENTRY_DSN,
      EXPO_PUBLIC_ENVIRONMENT: EXPO_PUBLIC_ENVIRONMENT || 'development',
      EXPO_PUBLIC_API_URL,
      eas: {
        projectId: 'lasso-dairy',
        owner: 'vie-incorporated'
      }
    },
  plugins: [
    [
      'sentry-expo',
      {
        organization: 'lasso-milk-and-creamery-llc',
        project: 'lasso-dairy-mobile',
        // Automatically upload source maps during the build
        autoUploadSourceMaps: true,
        authToken: EXPO_PUBLIC_SENTRY_AUTH_TOKEN,
        // Enable native error reporting
        enableInExpoDevelopment: true,
        // Configure native SDK settings
        config: {
          enableNativeCrashHandling: true,
          enableAutoPerformanceTracking: true,
          enableAutoSessionTracking: true,
          // Disable debug in production builds
          debug: EXPO_PUBLIC_ENVIRONMENT !== 'production',
          // Native specific options
          androidClientOptions: {
            anrEnabled: true, // Detect Application Not Responding situations
            nativeSdkEnabled: true
          },
          iosClientOptions: {
            enableOutOfMemoryTracking: true,
            enableWatchdogTerminationTracking: true,
            enableAutoPerformanceTracing: true,
            nativeSdkEnabled: true
          }
        }
      }
    ]
  ],
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: 'lasso-milk-and-creamery-llc',
          project: 'lasso-dairy-mobile',
          authToken: EXPO_PUBLIC_SENTRY_AUTH_TOKEN,
          setCommits: true,
          deployEnv: EXPO_PUBLIC_ENVIRONMENT
        }
      }
    ]
  },
  updates: {
    // Enable automatic updates to help recover from crashes
    enabled: true,
    fallbackToCacheTimeout: 0,
    checkAutomatically: 'ON_LOAD',
    url: 'https://u.expo.dev/lasso-dairy'
  }
  };
};
