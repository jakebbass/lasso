import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get environment variables from Constants (expo-constants)
const SUPABASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate essential credentials
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Please check your environment variables in .env file.');
}

// Initialize Supabase client
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Auth services
export const auth = {
  // Sign up a new user
  signUp: async ({ email, password, userData }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phone,
        },
      },
    });

    if (error) throw error;
    return { data };
  },

  // Sign in an existing user
  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data };
  },

  // Sign out the current user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get the current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  },

  // Get the current user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  // Reset password
  resetPasswordForEmail: async (email, options) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    return { data };
  },

  // Update password
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { data };
  },
};

// User profile services
export const users = {
  // Get user profile
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Update user profile
  updateProfile: async (userId, userData) => {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId);

    return { data, error };
  },

  // Get user addresses
  getAddresses: async (userId) => {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    return { data, error };
  },

  // Add user address
  addAddress: async (address) => {
    const { data, error } = await supabase
      .from('user_addresses')
      .insert(address);

    return { data, error };
  },

  // Update user address
  updateAddress: async (addressId, address) => {
    const { data, error } = await supabase
      .from('user_addresses')
      .update(address)
      .eq('id', addressId);

    return { data, error };
  },

  // Delete user address
  deleteAddress: async (addressId) => {
    const { data, error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId);

    return { data, error };
  },
};

// Products services
export const products = {
  // Get all products
  getAll: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');

    return { data, error };
  },

  // Get product by ID
  getById: async (productId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    return { data, error };
  },

  // Get products by category
  getByCategory: async (category) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('active', true)
      .order('name');

    return { data, error };
  },

  // Search products
  search: async (query) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name');

    return { data, error };
  },

  // Get product availability
  getAvailability: async (productId, date) => {
    const formattedDate = date instanceof Date
      ? date.toISOString().split('T')[0]
      : date;

    const { data, error } = await supabase
      .from('product_availability')
      .select('quantity')
      .eq('product_id', productId)
      .eq('available_date', formattedDate)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { available: 0, error };
    }

    return { available: data?.quantity || 0, error: null };
  },
};

// Orders services
export const orders = {
  // Get orders by user
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get order details
  getById: async (orderId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();

    return { data, error };
  },

  // Create a new order
  create: async (orderData) => {
    // First create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.userId,
        delivery_date: orderData.deliveryDate,
        total_amount: orderData.totalAmount,
        payment_status: orderData.paymentStatus || 'pending',
        status: orderData.status || 'pending',
        payment_id: orderData.paymentId,
        recurring: orderData.recurring || false,
        recurring_type: orderData.recurringType || 'none',
        next_delivery_date: orderData.nextDeliveryDate,
        street: orderData.street,
        city: orderData.city,
        state: orderData.state,
        zip_code: orderData.zipCode,
        country: orderData.country || 'USA',
        notes: orderData.notes,
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Then create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      size: item.size,
      category: item.category,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw itemsError;
    }

    return { order };
  },

  // Cancel an order
  cancel: async (orderId) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  },
};

export default supabase;
