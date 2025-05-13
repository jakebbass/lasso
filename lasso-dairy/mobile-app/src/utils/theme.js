/**
 * Theme configuration for Lasso Dairy mobile app
 */

export const COLORS = {
  primary: '#036C3E',     // Primary green
  secondary: '#E9C600',   // Secondary yellow
  background: '#FFFFFF',  // White background
  accent: '#17B571',      // Accent green
  textDark: '#333333',    // Dark text
  textLight: '#FFFFFF',   // Light text for dark backgrounds
  gray: '#6c757d',        // Gray for secondary text
  lightGray: '#e9ecef',   // Light gray for backgrounds
  danger: '#dc3545',      // Red for errors/alerts
  success: '#28a745',     // Green for success messages
  warning: '#ffc107',     // Yellow for warnings
  info: '#17a2b8',        // Blue for information
  disabled: '#cccccc',    // Color for disabled elements
  transparent: 'transparent'
};

export const FONTS = {
  regular: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500',
  },
  bold: {
    fontFamily: 'System',
    fontWeight: '700',
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300',
  },
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,
  margin: 20,

  // Font sizes
  largeTitle: 40,
  h1: 30,
  h2: 22,
  h3: 18,
  h4: 16,
  h5: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
  body5: 12,
  small: 10,
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.gray,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.gray,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },
  dark: {
    shadowColor: COLORS.gray,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.41,
    shadowRadius: 9.11,
    elevation: 14,
  },
};

export default { COLORS, FONTS, SIZES, SHADOWS };
