import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import Header from '../../components/Header';
import { products as productService } from '../../services/supabaseClient';

const ProductDetailsScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await productService.getById(productId);
        if (error) throw error;
        setProduct(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load product details');
        console.error('Error fetching product:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!product) return;
      
      setCheckingAvailability(true);
      try {
        const { available, error } = await productService.getAvailability(productId, selectedDate);
        if (error) throw error;
        setAvailability(available);
      } catch (error) {
        console.error('Error checking availability:', error.message);
        setAvailability(0);
      } finally {
        setCheckingAvailability(false);
      }
    };
    
    checkAvailability();
  }, [product, productId, selectedDate]);

  const incrementQuantity = () => {
    if (quantity < availability) {
      setQuantity(quantity + 1);
    } else {
      Alert.alert('Maximum Quantity', `Only ${availability} units available for the selected date.`);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    // Will implement in the cart screen
    Alert.alert('Added to Cart', `${quantity} x ${product.name} (${product.size}) added to your cart.`);
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Generate a list of dates for the next 7 days
  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={product.name}
        showBackButton
        onLeftPress={() => navigation.goBack()}
        rightIcon="cart-outline"
        onRightPress={() => navigation.navigate('Cart')}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>{product.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productSize}>{product.size}</Text>
          <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Select Delivery Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {getNextWeekDates().map((date) => (
              <TouchableOpacity
                key={date.toDateString()}
                style={[
                  styles.dateItem,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateItem,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  style={[
                    styles.dateText,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateText,
                  ]}
                >
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.availabilityContainer}>
            {checkingAvailability ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.availabilityText}>
                {availability > 0
                  ? `${availability} available`
                  : 'Not available for selected date'}
              </Text>
            )}
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity === 1 && styles.disabledButton]}
              onPress={decrementQuantity}
              disabled={quantity === 1}
            >
              <Ionicons
                name="remove"
                size={20}
                color={quantity === 1 ? COLORS.gray : COLORS.textDark}
              />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{quantity}</Text>
            
            <TouchableOpacity
              style={[styles.quantityButton, quantity >= availability && styles.disabledButton]}
              onPress={incrementQuantity}
              disabled={quantity >= availability}
            >
              <Ionicons
                name="add"
                size={20}
                color={quantity >= availability ? COLORS.gray : COLORS.textDark}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>
            ${(product.price * quantity).toFixed(2)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (availability === 0 || checkingAvailability) && styles.disabledCartButton,
          ]}
          onPress={handleAddToCart}
          disabled={availability === 0 || checkingAvailability}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
    ...FONTS.medium,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.lightGray,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  placeholderText: {
    fontSize: SIZES.h1 * 2,
    color: COLORS.gray,
    ...FONTS.bold,
  },
  infoContainer: {
    padding: 20,
  },
  productName: {
    fontSize: SIZES.h1,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  productSize: {
    fontSize: SIZES.h3,
    ...FONTS.regular,
    color: COLORS.gray,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  productPrice: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    color: COLORS.primary,
    marginBottom: 16,
  },
  description: {
    fontSize: SIZES.body3,
    color: COLORS.textDark,
    lineHeight: 24,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 12,
  },
  datesContainer: {
    paddingVertical: 8,
  },
  dateItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
  },
  selectedDateItem: {
    backgroundColor: COLORS.primary,
  },
  dateText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  selectedDateText: {
    color: COLORS.white,
  },
  availabilityContainer: {
    marginTop: 12,
    height: 20,
  },
  availabilityText: {
    fontSize: SIZES.body4,
    color: COLORS.gray,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.lightGray,
  },
  disabledButton: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: SIZES.h3,
    ...FONTS.medium,
    color: COLORS.textDark,
    paddingHorizontal: 20,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.background,
  },
  totalContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  totalLabel: {
    fontSize: SIZES.body4,
    color: COLORS.gray,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    color: COLORS.textDark,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  disabledCartButton: {
    backgroundColor: COLORS.disabled,
  },
  addToCartText: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.white,
  },
});

export default ProductDetailsScreen;
