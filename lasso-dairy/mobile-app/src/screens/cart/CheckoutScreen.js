import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import Header from '../../components/Header';
import AuthContext from '../../contexts/AuthContext';
import { users, orders } from '../../services/supabaseClient';

const CART_STORAGE_KEY = '@lasso_dairy_cart';

const CheckoutScreen = ({ navigation }) => {
  const { userData } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false,
  });

  useEffect(() => {
    loadCartItems();
    if (userData) {
      fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [userData]);

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

  const fetchAddresses = async () => {
    try {
      const { data, error } = await users.getAddresses(userData.id);
      if (error) throw error;
      
      setAddresses(data || []);
      
      // Auto-select default address if available
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (data && data.length > 0) {
        setSelectedAddress(data[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error.message);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal(); // For now, no additional fees
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
  };

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
  };

  const validateForm = () => {
    if (!selectedAddress) {
      Alert.alert('Missing Information', 'Please select a delivery address');
      return false;
    }
    
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return false;
    }
    
    return true;
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zip_code) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }
    
    try {
      setLoading(true);
      const addressData = {
        ...newAddress,
        user_id: userData.id,
        country: 'USA',
      };
      
      const { data, error } = await users.addAddress(addressData);
      if (error) throw error;
      
      // Refresh addresses
      await fetchAddresses();
      
      // Reset form and hide it
      setNewAddress({
        street: '',
        city: '',
        state: '',
        zip_code: '',
        is_default: false,
      });
      setShowAddAddress(false);
      
      Alert.alert('Success', 'Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    setProcessingOrder(true);
    try {
      // Create the order
      const orderData = {
        userId: userData.id,
        deliveryDate: cartItems[0].deliveryDate, // Assuming all items have same delivery date
        totalAmount: calculateTotal(),
        paymentStatus: 'pending', // Will be updated after payment
        status: 'pending',
        paymentId: null, // Will be updated after payment
        recurring: false,
        recurringType: 'none',
        nextDeliveryDate: null,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zip_code,
        country: selectedAddress.country || 'USA',
        notes: notes,
        items: cartItems,
      };
      
      const { order } = await orders.create(orderData);
      
      // Clear cart
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
      
      // Navigate to order success screen
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MainApp' },
          { name: 'OrderDetails', params: { orderId: order.id } },
        ],
      });
      
      Alert.alert(
        'Order Placed Successfully',
        'Your order has been placed and is now being processed.'
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        'There was an error processing your order. Please try again later.'
      );
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Checkout"
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
        title="Checkout"
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Delivery Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {!showAddAddress && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddAddress(true)}
                >
                  <Text style={styles.addButtonText}>Add New</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {showAddAddress ? (
              <View style={styles.addAddressForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Street Address"
                  value={newAddress.street}
                  onChangeText={(text) => setNewAddress({ ...newAddress, street: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={newAddress.city}
                  onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
                />
                <View style={styles.formRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="State"
                    value={newAddress.state}
                    onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="ZIP Code"
                    keyboardType="numeric"
                    value={newAddress.zip_code}
                    onChangeText={(text) => setNewAddress({ ...newAddress, zip_code: text })}
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setNewAddress({ ...newAddress, is_default: !newAddress.is_default })}
                >
                  <View
                    style={[
                      styles.checkbox,
                      newAddress.is_default && styles.checkboxSelected,
                    ]}
                  >
                    {newAddress.is_default && (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Set as default address</Text>
                </TouchableOpacity>
                
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setShowAddAddress(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, styles.saveButton]}
                    onPress={handleAddAddress}
                  >
                    <Text style={styles.saveButtonText}>Save Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : addresses.length === 0 ? (
              <View style={styles.emptyAddressContainer}>
                <Text style={styles.emptyAddressText}>
                  You don't have any saved addresses. Please add a delivery address.
                </Text>
              </View>
            ) : (
              <View style={styles.addressList}>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressCard,
                      selectedAddress?.id === address.id && styles.selectedAddressCard,
                    ]}
                    onPress={() => handleSelectAddress(address)}
                  >
                    <View style={styles.addressContent}>
                      <Text style={styles.addressText}>{address.street}</Text>
                      <Text style={styles.addressText}>
                        {address.city}, {address.state} {address.zip_code}
                      </Text>
                    </View>
                    
                    {selectedAddress?.id === address.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Payment Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'credit_card' && styles.selectedPaymentMethod,
              ]}
              onPress={() => handleSelectPaymentMethod('credit_card')}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name="card" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Credit Card</Text>
                <Text style={styles.paymentSubtitle}>Pay with your credit card</Text>
              </View>
              {paymentMethod === 'credit_card' && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'cash' && styles.selectedPaymentMethod,
              ]}
              onPress={() => handleSelectPaymentMethod('cash')}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name="cash" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentSubtitle}>Pay when your order arrives</Text>
              </View>
              {paymentMethod === 'cash' && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Order Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any special instructions..."
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Order Summary Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            
            {cartItems.map((item, index) => (
              <View key={index} style={styles.summaryItem}>
                <View style={styles.summaryItemDetails}>
                  <Text style={styles.summaryItemName}>{item.name}</Text>
                  <Text style={styles.summaryItemSize}>{item.size}</Text>
                </View>
                <Text style={styles.summaryItemQuantity}>{item.quantity}x</Text>
                <Text style={styles.summaryItemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${calculateSubtotal().toFixed(2)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery Fee</Text>
              <Text style={styles.totalValue}>$0.00</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${calculateTotal().toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total:</Text>
            <Text style={styles.footerTotalAmount}>${calculateTotal().toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}
            disabled={processingOrder || addresses.length === 0}
          >
            {processingOrder ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.textDark,
  },
  addButton: {
    padding: 4,
  },
  addButtonText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.primary,
  },
  emptyAddressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyAddressText: {
    fontSize: SIZES.body4,
    color: COLORS.gray,
    textAlign: 'center',
  },
  addressList: {
    marginTop: 8,
  },
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    marginBottom: 12,
  },
  selectedAddressCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: SIZES.body4,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  paymentSubtitle: {
    fontSize: SIZES.body5,
    color: COLORS.gray,
  },
  notesInput: {
    height: 80,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: SIZES.body4,
    color: COLORS.textDark,
    textAlignVertical: 'top',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  summaryItemDetails: {
    flex: 1,
  },
  summaryItemName: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  summaryItemSize: {
    fontSize: SIZES.body5,
    color: COLORS.gray,
  },
  summaryItemQuantity: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
    marginRight: 16,
  },
  summaryItemPrice: {
    fontSize: SIZES.body3,
    ...FONTS.bold,
    color: COLORS.textDark,
    minWidth: 60,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: SIZES.body4,
    color: COLORS.gray,
  },
  totalValue: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  grandTotalLabel: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.textDark,
  },
  grandTotalValue: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: SIZES.body5,
    color: COLORS.gray,
    marginBottom: 4,
  },
  footerTotalAmount: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.textDark,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  placeOrderButtonText: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.white,
  },
  addAddressForm: {
    marginTop: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    fontSize: SIZES.body4,
    color: COLORS.textDark,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: SIZES.body4,
    color: COLORS.textDark,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  formButton: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius,
  },
  cancelButton: {
    marginRight: 8,
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.white,
  },
});

export default CheckoutScreen;
