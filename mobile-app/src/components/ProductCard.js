import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';

const ProductCard = ({ product, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(product)}>
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{product.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.size}>{product.size}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: 15,
    ...SHADOWS.medium,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.lightGray,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: SIZES.radius,
    borderTopRightRadius: SIZES.radius,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  placeholderText: {
    fontSize: SIZES.h1,
    color: COLORS.gray,
    ...FONTS.bold,
  },
  contentContainer: {
    padding: 10,
  },
  name: {
    ...FONTS.medium,
    fontSize: SIZES.body3,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  size: {
    ...FONTS.regular,
    fontSize: SIZES.body4,
    color: COLORS.gray,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...FONTS.bold,
    fontSize: SIZES.body3,
    color: COLORS.primary,
  },
});

export default ProductCard;
