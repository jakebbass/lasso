import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import Header from '../../components/Header';
import AuthContext from '../../contexts/AuthContext';
import { users } from '../../services/supabaseClient';

const EditProfileScreen = ({ navigation }) => {
  const { userData, updateUserData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });
    }
  }, [userData]);

  const handleChange = (key, value) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name field cannot be empty');
      return false;
    }
    
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email field cannot be empty');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (formData.phone) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/[-\s()]/g, ''))) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const { error } = await users.updateProfile(userData.id, {
        name: formData.name,
        phone: formData.phone,
        // Note: Email can't be updated directly in Supabase Auth
        // A separate email change flow would be required
      });
      
      if (error) throw error;
      
      // Update context with new user data
      updateUserData({
        ...userData,
        name: formData.name,
        phone: formData.phone,
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Edit Profile"
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Edit Profile"
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImageText}>
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.gray}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.email}
                editable={false}
                placeholderTextColor={COLORS.gray}
              />
              <Text style={styles.helperText}>
                Email address cannot be changed here.
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.gray}
                keyboardType="phone-pad"
              />
            </View>
            
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Text style={styles.changePasswordText}>Change Password</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageText: {
    fontSize: SIZES.h1,
    ...FONTS.bold,
    color: COLORS.white,
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
  disabledInput: {
    backgroundColor: COLORS.lightGray,
    color: COLORS.gray,
  },
  helperText: {
    fontSize: SIZES.body5,
    color: COLORS.gray,
    marginTop: 6,
  },
  changePasswordButton: {
    alignItems: 'flex-start',
    marginTop: 10,
  },
  changePasswordText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 55,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  saveButtonText: {
    fontSize: SIZES.h3,
    ...FONTS.medium,
    color: COLORS.white,
  },
});

export default EditProfileScreen;
