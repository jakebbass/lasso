import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
import { triggerTestError } from '../../utils/testSentry';
import { reportError } from '../../utils/sentryConfig';

/**
 * Debug screen for testing Sentry integration
 * This screen should only be accessible in development builds
 */
const SentryDebugScreen = ({ navigation }) => {
  const [lastAction, setLastAction] = useState('None');
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  
  const environment = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT || 'development';
  const dsn = Constants.expoConfig?.extra?.EXPO_PUBLIC_SENTRY_DSN || 'Not configured';
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.runtimeVersion || 'unknown';
  
  // Get Sentry configuration state
  const sentryStatus = {
    enabled: !!Constants.expoConfig?.extra?.EXPO_PUBLIC_SENTRY_DSN,
    environment,
    nativeEnabled: true, // Based on our config
    version: appVersion,
    build: buildNumber,
    platform: Platform.OS
  };

  // Test different error scenarios
  const testErrorScenarios = [
    {
      title: 'Handled Exception',
      description: 'Triggers an exception and captures it with Sentry',
      action: () => {
        triggerTestError('handled');
        setLastAction('Sent handled exception to Sentry');
      }
    },
    {
      title: 'Unhandled Exception',
      description: 'Triggers an uncaught exception (will crash the app)',
      action: () => {
        Alert.alert(
          'Unhandled Exception',
          'This will crash the app. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => {
                setLastAction('Triggered unhandled exception');
                triggerTestError('unhandled');
              },
              style: 'destructive'
            }
          ]
        );
      }
    },
    {
      title: 'Native Crash',
      description: 'Triggers a crash in native code (will crash the app)',
      action: () => {
        triggerTestError('native');
        setLastAction('Attempted to trigger native crash');
      }
    },
    {
      title: 'Send Breadcrumb',
      description: 'Adds a navigation breadcrumb to Sentry',
      action: () => {
        Sentry.addBreadcrumb({
          category: 'navigation',
          message: 'Visited Sentry Debug Screen',
          data: {
            screen: 'SentryDebugScreen',
            timestamp: new Date().toISOString()
          }
        });
        setLastAction('Added navigation breadcrumb');
      }
    },
    {
      title: 'Custom Message',
      description: 'Sends a custom message to Sentry',
      action: () => {
        Sentry.captureMessage('Test message from debug screen', {
          level: 'info',
          tags: {
            session_id: sessionId,
            test_case: 'manual_message'
          }
        });
        setLastAction('Sent custom message to Sentry');
      }
    },
    {
      title: 'Report Error with Context',
      description: 'Creates an error with additional context data',
      action: () => {
        const error = new Error('Test error with rich context');
        reportError(error, {
          screen: 'SentryDebugScreen',
          sessionId: sessionId,
          testCase: 'manual_error_with_context',
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
            model: Platform.OS === 'ios' ? 'iOS Device' : Platform.constants.Model
          }
        });
        setLastAction('Reported error with context');
      }
    }
  ];

  // Generate new session ID for grouping test events
  const regenerateSessionId = () => {
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    Sentry.setTag('session_id', newSessionId);
    Alert.alert('New Session ID', `Session ID updated to: ${newSessionId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Sentry Debug Console</Text>
        
        {/* Sentry Status */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sentry Configuration</Text>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Status:</Text>
            <Text style={[
              styles.configValue, 
              { color: sentryStatus.enabled ? '#4CAF50' : '#F44336' }
            ]}>
              {sentryStatus.enabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Environment:</Text>
            <Text style={styles.configValue}>{sentryStatus.environment}</Text>
          </View>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Native Reporting:</Text>
            <Text style={styles.configValue}>
              {sentryStatus.nativeEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Version:</Text>
            <Text style={styles.configValue}>
              {sentryStatus.version} (Build {sentryStatus.build})
            </Text>
          </View>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Platform:</Text>
            <Text style={styles.configValue}>{sentryStatus.platform}</Text>
          </View>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Session ID:</Text>
            <Text style={styles.configValue}>{sessionId}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={regenerateSessionId}
          >
            <Text style={styles.buttonText}>Regenerate Session ID</Text>
          </TouchableOpacity>
        </View>
        
        {/* Test Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          {testErrorScenarios.map((scenario, index) => (
            <View key={index} style={styles.testScenario}>
              <Text style={styles.scenarioTitle}>{scenario.title}</Text>
              <Text style={styles.scenarioDescription}>{scenario.description}</Text>
              <TouchableOpacity 
                style={[
                  styles.button,
                  scenario.title.includes('Crash') ? styles.dangerButton : null
                ]}
                onPress={scenario.action}
              >
                <Text style={styles.buttonText}>Run Test</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        {/* Last Action */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Last Action</Text>
          <Text style={styles.lastAction}>{lastAction}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This screen is for development purposes only.{'\n'}
            Remove or hide it in production builds.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  configLabel: {
    fontSize: 16,
    color: '#666'
  },
  configValue: {
    fontSize: 16,
    fontWeight: '500'
  },
  testScenario: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  dangerButton: {
    backgroundColor: '#F44336'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500'
  },
  lastAction: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic'
  },
  footer: {
    marginTop: 12,
    marginBottom: 24,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center'
  }
});

export default SentryDebugScreen;
