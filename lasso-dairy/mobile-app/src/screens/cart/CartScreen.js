import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import Header from '../../components/Header';
import AuthContext from '../../contexts/AuthContext';

const CART_STORAGE_KEY = '@lasso_dairy_cart';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useContext(AuthContext);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCartItems = async (items) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart items:', error);
    }
  };

  const updateQuantity = (id, deliveryDate, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    const updatedItems = cartItems.map((item) => {
      if (item.id === id && item.deliveryDate === deliveryDate) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    setCartItems(updatedItems);
    saveCartItems(updatedItems);
  };

  const removeItem = (id, deliveryDate) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedItems = cartItems.filter(
              (item) => !(item.id === id && item.deliveryDate === deliveryDate)
            );
            setCartItems(updatedItems);
            saveCartItems(updatedItems);
          },
        },
      ]
    );
  };

  const clearCart = () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear your cart?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCartItems([]);
            saveCartItems([]);
          },
        },
      ]
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleCheckout = () => {
    if (!userData) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to continue with your order',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }

    navigation.navigate('Checkout');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.productImageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSize}>{item.size}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.deliveryDate}>
          Delivery: {formatDate(item.deliveryDate)}
        </Text>
      </View>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.deliveryDate, item.quantity - 1)}
        >
          <Ionicons name="remove" size={18} color={COLORS.textDark} />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.deliveryDate, item.quantity + 1)}
        >
          <Ionicons name="add" size={18} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item.id, item.deliveryDate)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Cart"
        showBackButton
        onLeftPress={() => navigation.goBack()}
        rightIcon={cartItems.length > 0 ? "trash-outline" : null}
        onRightPress={clearCart}
      />
      
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={80} color={COLORS.lightGray} />
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartMessage}>
            Browse our products and add items to your cart
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item, index) => `${item.id}-${item.deliveryDate}-${index}`}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={() => <View style={{ height: 100 }} />}
          />
          
          <View style={styles.bottomContainer}>
            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  ${calculateTotal().toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>$0.00</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ${calculateTotal().toFixed(2)}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  cartList: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    marginBottom: 16,
    padding: 12,
    ...SHADOWS.light,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
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
    fontSize: SIZES.h2,
    color: COLORS.gray,
    ...FONTS.bold,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  productSize: {
    fontSize: SIZES.body5,
    ...FONTS.regular,
    color: COLORS.gray,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: SIZES.body4,
    ...FONTS.bold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  deliveryDate: {
    fontSize: SIZES.body5,
    color: COLORS.gray,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
  },
  quantityText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
    paddingHorizontal: 10,
  },
  removeButton: {
    padding: 4,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  emptyCartTitle: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyCartMessage: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  shopButtonText: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.white,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    padding: 16,
  },
  orderSummary: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: SIZES.body4,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.primary,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  checkoutButtonText: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.white,
  },
});

export default CartScreen;
