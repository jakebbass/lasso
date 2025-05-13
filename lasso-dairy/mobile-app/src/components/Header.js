import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../utils/theme';

const Header = ({ 
  title, 
  leftIcon, 
  rightIcon, 
  onLeftPress, 
  onRightPress, 
  showBackButton = false 
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onLeftPress}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        )}
        {leftIcon && !showBackButton && (
          <TouchableOpacity style={styles.iconButton} onPress={onLeftPress}>
            <Ionicons name={leftIcon} size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.rightContainer}>
        {rightIcon && (
          <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
            <Ionicons name={rightIcon} size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...FONTS.medium,
    fontSize: SIZES.h3,
    color: COLORS.textDark,
  },
  backButton: {
    padding: 4,
  },
  iconButton: {
    padding: 4,
  },
});

export default Header;
