const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { 
      products, 
      delivery_date, 
      delivery_address, 
      payment_id,
      recurring,
      recurring_type,
      notes
    } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Verify products and calculate total
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product_id);
      
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product_id}` });
      }
      
      // Check availability
      if (!product.isAvailable(new Date(delivery_date), item.quantity)) {
        return res.status(400).json({ 
          message: `Product ${product.name} is not available in the requested quantity for the selected date` 
        });
      }
      
      // Update product availability
      await product.updateAvailability(new Date(delivery_date), item.quantity);
      
      // Add to order products array
      orderProducts.push({
        product_id: product._id,
        name: product.name,
        size: product.size,
        category: product.category,
        quantity: item.quantity,
        price: product.price
      });
      
      totalAmount += product.price * item.quantity;
    }

    // Create order
    const order = await Order.create({
      user_id: req.user._id,
      products: orderProducts,
      delivery_date,
      delivery_address: delivery_address || req.user.address,
      total_amount: totalAmount,
      payment_id,
      payment_status: payment_id ? 'paid' : 'pending',
      recurring: recurring || false,
      recurring_type: recurring_type || 'none',
      notes
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order belongs to the logged in user or if user is admin
    if (order.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user_id', 'id name email').sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    const updatedOrder = await order.save();
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
exports.updateOrderPayment = async (req, res) => {
  try {
    const { payment_status, payment_id } = req.body;
    
    if (!payment_status) {
      return res.status(400).json({ message: 'Payment status is required' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.payment_status = payment_status;
    if (payment_id) {
      order.payment_id = payment_id;
    }
    
    const updatedOrder = await order.save();
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if the order belongs to the logged in user or if user is admin
    if (order.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Check if order can be cancelled (e.g., not already delivered)
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }
    
    // Update order status to cancelled
    order.status = 'cancelled';
    
    // Restore product availability
    for (const item of order.products) {
      const product = await Product.findById(item.product_id);
      if (product) {
        const dateString = new Date(order.delivery_date).toISOString().split('T')[0];
        const currentAvailability = product.availability_by_date.get(dateString) || 0;
        product.availability_by_date.set(dateString, currentAvailability + item.quantity);
        await product.save();
      }
    }
    
    const updatedOrder = await order.save();
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get delivery data for route optimization
// @route   GET /api/orders/delivery-routes
// @access  Private/Admin
exports.getDeliveryRoutes = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Find all orders for the specified date with status 'processing' or 'pending'
    const orders = await Order.find({
      delivery_date: {
        $gte: new Date(dateString),
        $lt: new Date(new Date(dateString).setDate(new Date(dateString).getDate() + 1))
      },
      status: { $in: ['pending', 'processing'] }
    }).populate('user_id', 'name phone address');
    
    // Format data for route optimization
    const deliveryData = orders.map(order => ({
      order_id: order._id,
      customer_name: order.user_id.name,
      phone: order.user_id.phone,
      address: order.delivery_address || order.user_id.address,
      products: order.products.map(p => ({
        name: p.name,
        quantity: p.quantity
      })),
      total_amount: order.total_amount
    }));
    
    res.status(200).json(deliveryData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process recurring orders
// @route   POST /api/orders/process-recurring
// @access  Private/Admin
exports.processRecurringOrders = async (req, res) => {
  try {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Find all recurring orders that need to be processed today
    const recurringOrders = await Order.find({
      recurring: true,
      next_delivery_date: {
        $gte: new Date(todayString),
        $lt: new Date(new Date(todayString).setDate(new Date(todayString).getDate() + 1))
      },
      status: { $nin: ['cancelled'] }
    });
    
    const newOrders = [];
    
    // Process each recurring order
    for (const order of recurringOrders) {
      // Check product availability before creating new order
      let productsAvailable = true;
      
      for (const item of order.products) {
        const product = await Product.findById(item.product_id);
        
        if (!product || !product.isAvailable(today, item.quantity)) {
          productsAvailable = false;
          break;
        }
      }
      
      if (productsAvailable) {
        // Update product availability
        for (const item of order.products) {
          const product = await Product.findById(item.product_id);
          await product.updateAvailability(today, item.quantity);
        }
        
        // Create new order based on recurring order
        const newOrder = await Order.create({
          user_id: order.user_id,
          products: order.products,
          order_date: new Date(),
          delivery_date: today,
          delivery_address: order.delivery_address,
          total_amount: order.total_amount,
          payment_status: 'pending', // Requires payment
          recurring: true,
          recurring_type: order.recurring_type,
          notes: `Recurring order from ${order._id}`
        });
        
        newOrders.push(newOrder);
      }
      
      // Update next delivery date for the recurring order
      if (order.recurring_type === 'weekly') {
        order.next_delivery_date = new Date(new Date(order.next_delivery_date).setDate(new Date(order.next_delivery_date).getDate() + 7));
      } else if (order.recurring_type === 'biweekly') {
        order.next_delivery_date = new Date(new Date(order.next_delivery_date).setDate(new Date(order.next_delivery_date).getDate() + 14));
      }
      
      await order.save();
    }
    
    res.status(200).json({
      message: `Processed ${newOrders.length} recurring orders`,
      orders: newOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
