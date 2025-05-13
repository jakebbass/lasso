import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import Header from '../../components/Header';
import AuthContext from '../../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { userData, signOut } = useContext(AuthContext);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Profile" />
        <View style={styles.signInContainer}>
          <Text style={styles.signInTitle}>You're not signed in</Text>
          <Text style={styles.signInMessage}>
            Sign in to view your profile and orders
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Profile" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImageText}>
              {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="person-outline" size={24} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Addresses')}
          >
            <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Delivery Addresses</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PaymentMethods')}
          >
            <Ionicons name="card-outline" size={24} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Help')}
          >
            <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('About')}
          >
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.menuItemText}>About Us</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageText: {
    fontSize: SIZES.h1,
    ...FONTS.bold,
    color: COLORS.white,
  },
  userName: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuItemText: {
    flex: 1,
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.textDark,
    marginLeft: 12,
  },
  signOutButton: {
    marginTop: 40,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  signOutText: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.white,
  },
  versionText: {
    fontSize: SIZES.body5,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 16,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  signInTitle: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  signInMessage: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 30,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  signInButtonText: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.white,
  },
});

export default ProfileScreen;
