import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { orders as orderService } from '../../services/supabaseClient';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await orderService.getById(orderId);
      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error.message);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'processing':
        return COLORS.info;
      case 'shipped':
        return COLORS.accent;
      case 'delivered':
        return COLORS.success;
      case 'cancelled':
        return COLORS.danger;
      default:
        return COLORS.gray;
    }
  };

  const handleCancelOrder = () => {
    if (order.status === 'cancelled') {
      Alert.alert('Order already cancelled', 'This order has already been cancelled.');
      return;
    }

    if (['delivered', 'shipped'].includes(order.status)) {
      Alert.alert(
        'Cannot Cancel',
        'This order cannot be cancelled because it has already been shipped or delivered.'
      );
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { data, error } = await orderService.cancel(orderId);
              if (error) throw error;
              setOrder(data);
              Alert.alert('Success', 'Your order has been cancelled successfully.');
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order. Please try again later.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Order Details"
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Order Details"
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Order Details"
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Order ID:</Text>
            <Text style={styles.orderId}>{order.id.substring(0, 8)}</Text>
          </View>
          
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getOrderStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Date:</Text>
            <Text style={styles.detailValue}>
              {formatDate(order.created_at)} at {formatTime(order.created_at)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Date:</Text>
            <Text style={styles.detailValue}>{formatDate(order.delivery_date)}</Text>
          </View>
          {order.recurring && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recurring:</Text>
              <Text style={styles.detailValue}>
                {order.recurring_type.charAt(0).toUpperCase() + order.recurring_type.slice(1)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>{order.street}</Text>
          <Text style={styles.addressText}>
            {order.city}, {order.state} {order.zip_code}
          </Text>
          <Text style={styles.addressText}>{order.country}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items && order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSize}>{item.size}</Text>
              </View>
              <View style={styles.itemQuantity}>
                <Text style={styles.quantityText}>{item.quantity}x</Text>
              </View>
              <View style={styles.itemPrice}>
                <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>$0.00</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {['pending', 'processing'].includes(order.status) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
          >
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    color: COLORS.textDark,
    marginBottom: 16,
  },
  errorButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body3,
    ...FONTS.medium,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    marginRight: 8,
  },
  orderId: {
    fontSize: SIZES.body3,
    ...FONTS.bold,
    color: COLORS.textDark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 110,
    fontSize: SIZES.body4,
    color: COLORS.gray,
  },
  detailValue: {
    flex: 1,
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  addressText: {
    fontSize: SIZES.body4,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  itemSize: {
    fontSize: SIZES.body5,
    color: COLORS.gray,
    textTransform: 'capitalize',
  },
  itemQuantity: {
    marginRight: 16,
  },
  quantityText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  itemPrice: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: SIZES.body4,
    ...FONTS.bold,
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 16,
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
  notesText: {
    fontSize: SIZES.body4,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.medium,
  },
  cancelButtonText: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.white,
  },
});

export default OrderDetailsScreen;
