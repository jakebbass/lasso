const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Sentry
const Sentry = require('./config/sentry');

// Import routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Initialize Sentry request handler (must be first middleware)
app.use(Sentry.Handlers.requestHandler());

// Standard middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// The Sentry error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware (after Sentry)
app.use((err, req, res, next) => {
  // Log error
  console.error('Server error:', err);
  
  // Send appropriate response
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error);
    }
    process.exit(1);
  }
};

// Load production environment variables if in production
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production' });
  console.log('Loaded production environment variables');
}

// Start server
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
}

module.exports = app; // For testing purposes
