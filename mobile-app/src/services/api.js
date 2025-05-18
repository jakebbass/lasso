import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual API base URL in production
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User API Services
export const userService = {
  login: async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
};

// Product API Services
export const productService = {
  getAllProducts: async (category) => {
    const params = category ? { category } : {};
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  getProductAvailability: async () => {
    const response = await api.get('/products/availability');
    return response.data;
  },
};

// Order API Services
export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  getMyOrders: async () => {
    const response = await api.get('/orders/myorders');
    return response.data;
  },
  
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  cancelOrder: async (id) => {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data;
  },
};

// Payment API Services
export const paymentService = {
  createPaymentIntent: async (paymentData) => {
    const response = await api.post('/payments/create-payment-intent', paymentData);
    return response.data;
  },
  
  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  },
};

export default {
  userService,
  productService,
  orderService,
  paymentService,
};
