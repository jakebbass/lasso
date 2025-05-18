import { createClient } from '@supabase/supabase-js';

// Environment variables should be set in .env file
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API functions for interacting with Supabase
export const api = {
  // Products
  getProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data;
  },
  
  getProductById: async (id) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  createProduct: async (productData) => {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();
      
    if (error) throw error;
    return data[0];
  },
  
  updateProduct: async (id, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data[0];
  },
  
  deleteProduct: async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  },
  
  // Orders
  getOrders: async (status = null) => {
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:user_id (id, email, first_name, last_name),
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (id, name, image_url)
        )
      `)
      .order('created_at', { ascending: false });
      
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },
  
  getOrderById: async (id) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:user_id (id, email, first_name, last_name),
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (id, name, image_url)
        )
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  updateOrderStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data[0];
  },
  
  // Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },
  
  getUserById: async (id) => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        orders (id, status, total_amount, created_at)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Dashboard analytics
  getDashboardStats: async () => {
    // Get counts
    const [
      usersResponse, 
      ordersResponse, 
      productsResponse,
      revenueResponse,
      recentOrdersResponse
    ] = await Promise.all([
      // Total users
      supabase
        .from('users')
        .select('id', { count: 'exact' }),
      
      // Total orders
      supabase
        .from('orders')
        .select('id', { count: 'exact' }),
      
      // Total products
      supabase
        .from('products')
        .select('id', { count: 'exact' }),
      
      // Total revenue
      supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed'),
        
      // Recent orders
      supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          total_amount,
          user:user_id (email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
    
    // Check for errors
    if (usersResponse.error) throw usersResponse.error;
    if (ordersResponse.error) throw ordersResponse.error;
    if (productsResponse.error) throw productsResponse.error;
    if (revenueResponse.error) throw revenueResponse.error;
    if (recentOrdersResponse.error) throw recentOrdersResponse.error;
    
    // Calculate total revenue
    const totalRevenue = revenueResponse.data.reduce(
      (sum, order) => sum + (parseFloat(order.total_amount) || 0), 
      0
    );
    
    return {
      userCount: usersResponse.count,
      orderCount: ordersResponse.count,
      productCount: productsResponse.count,
      totalRevenue,
      recentOrders: recentOrdersResponse.data
    };
  }
};
