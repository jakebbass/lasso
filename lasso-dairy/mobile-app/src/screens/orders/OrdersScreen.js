import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import Header from '../../components/Header';
import AuthContext from '../../contexts/AuthContext';
import { orders as orderService } from '../../services/supabaseClient';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const { userData } = useContext(AuthContext);

  useEffect(() => {
    if (userData) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [userData]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await orderService.getByUser(userData.id);
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingOrders = () => {
    const now = new Date();
    return orders.filter(
      (order) => new Date(order.delivery_date) >= now && order.status !== 'cancelled'
    );
  };

  const getPastOrders = () => {
    const now = new Date();
    return orders.filter(
      (order) => new Date(order.delivery_date) < now || order.status === 'cancelled'
    );
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.id.substring(0, 8)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getOrderStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.order_date)}</Text>
        </View>
        
        <View style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Delivery:</Text>
          <Text style={styles.detailValue}>{formatDate(item.delivery_date)}</Text>
        </View>
        
        <View style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>{item.items ? item.items.length : 0}</Text>
        </View>
        
        <View style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.total_amount)}</Text>
        </View>
      </View>
      
      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.orderActionButton}
          onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
          <Text style={styles.orderActionText}>Details</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Orders" />
        <View style={styles.signInContainer}>
          <Text style={styles.signInTitle}>You're not signed in</Text>
          <Text style={styles.signInMessage}>
            Sign in to view your orders
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Orders" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const displayedOrders = activeTab === 'upcoming' ? getUpcomingOrders() : getPastOrders();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Orders" />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'upcoming' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'upcoming' && styles.activeTabButtonText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'past' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'past' && styles.activeTabButtonText,
            ]}
          >
            Past Orders
          </Text>
        </TouchableOpacity>
      </View>
      
      {displayedOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} orders
          </Text>
          <Text style={styles.emptyMessage}>
            {activeTab === 'upcoming'
              ? 'You have no upcoming orders at the moment.'
              : 'Your order history will appear here.'}
          </Text>
          {activeTab === 'upcoming' && (
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopButtonText}>Shop Now</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: SIZES.body3,
    ...FONTS.medium,
    color: COLORS.gray,
  },
  activeTabButtonText: {
    color: COLORS.primary,
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    marginBottom: 16,
    padding: 16,
    ...SHADOWS.light,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: SIZES.body3,
    ...FONTS.bold,
    color: COLORS.textDark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: SIZES.body5,
    ...FONTS.medium,
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  orderDetails: {
    marginBottom: 16,
  },
  orderDetail: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: SIZES.body4,
    color: COLORS.gray,
  },
  detailValue: {
    flex: 1,
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  orderActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  orderActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  orderActionText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.primary,
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  emptyTitle: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyMessage: {
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

export default OrdersScreen;
