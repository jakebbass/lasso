import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import supabase from '../../services/supabaseClient';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'lassoapp://reset-password',
      });
      
      if (error) throw error;
      
      setResetSent(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerText}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            {resetSent
              ? 'Reset link sent! Check your email.'
              : 'Enter your email to receive a password reset link'}
          </Text>

          {!resetSent ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                If your email exists in our system, you'll receive instructions to reset your password.
              </Text>
              <Text style={styles.successNote}>
                Be sure to check your spam or junk folders if you don't see the email.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerText: {
    fontSize: SIZES.h1,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: SIZES.h4,
    color: COLORS.gray,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: 15,
    fontSize: SIZES.body3,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
    ...SHADOWS.light,
  },
  resetButton: {
    height: 55,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    ...SHADOWS.medium,
  },
  resetButtonText: {
    fontSize: SIZES.h3,
    color: COLORS.white,
    ...FONTS.medium,
  },
  backButton: {
    alignItems: 'center',
    marginTop: resetSent => resetSent ? 40 : 10,
  },
  backButtonText: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
    ...FONTS.medium,
  },
  successContainer: {
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: COLORS.lightGray,
    padding: 20,
    borderRadius: SIZES.radius,
  },
  successText: {
    fontSize: SIZES.body3,
    color: COLORS.textDark,
    marginBottom: 10,
    lineHeight: 22,
  },
  successNote: {
    fontSize: SIZES.body4,
    color: COLORS.gray,
    lineHeight: 20,
  },
});

export default ForgotPasswordScreen;
