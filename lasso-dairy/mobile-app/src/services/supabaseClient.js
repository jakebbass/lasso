import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mnqmjrftcvuimfiredvd.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucW1qcmZ0Y3Z1aW1maXJlZHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMTAxMTEsImV4cCI6MjA2MjY4NjExMX0.mkkz0cjdgRrlVPiy5TLvG8wyHTsI7HEIyxPN7S-fzyo';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User authentication methods
export const auth = {
  // Sign up a new user
  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  // Sign in an existing user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out the current user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get the current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Update user data
  updateUser: async (userData) => {
    const { data, error } = await supabase.auth.updateUser({
      data: userData,
    });
    return { data, error };
  },
};

// Product methods
export const products = {
  // Get all products
  getAll: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);
    return { data, error };
  },

  // Get a single product by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Get product availability for a specific date
  getAvailability: async (productId, date) => {
    const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const { data, error } = await supabase
      .from('product_availability')
      .select('quantity')
      .eq('product_id', productId)
      .eq('available_date', dateStr)
      .single();
    return { 
      available: data?.quantity || 0,
      error 
    };
  },

  // Get products by category
  getByCategory: async (category) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('active', true);
    return { data, error };
  },
};

// Order methods
export const orders = {
  // Create a new order
  create: async (orderData) => {
    // First, create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: orderData.userId,
        delivery_date: orderData.deliveryDate,
        total_amount: 0, // This will be calculated by the trigger
        payment_status: 'pending',
        status: 'pending',
        recurring: orderData.recurring || false,
        recurring_type: orderData.recurringType || 'none',
        street: orderData.street,
        city: orderData.city,
        state: orderData.state,
        zip_code: orderData.zipCode,
        country: orderData.country || 'USA',
        notes: orderData.notes,
      }])
      .select()
      .single();

    if (orderError) {
      return { error: orderError };
    }

    // Then, add order items
    const orderItems = orderData.products.map(product => ({
      order_id: order.id,
      product_id: product.id,
      quantity: product.quantity,
      price: product.price,
      name: product.name,
      size: product.size,
      category: product.category,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    // Get the updated order with calculated total
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .single();

    return { 
      data: updatedOrder, 
      error: itemsError || updateError 
    };
  },

  // Get all orders for the current user
  getUserOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Get order details by ID
  getById: async (orderId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single();
    return { data, error };
  },

  // Update order status
  updateStatus: async (orderId, status) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    return { data, error };
  },

  // Cancel an order
  cancelOrder: async (orderId) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .select()
      .single();
    return { data, error };
  },
};

// User profile methods
export const userProfiles = {
  // Get user profile
  get: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Update user profile
  update: async (userId, profileData) => {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
};

// Default export
export default supabase;
