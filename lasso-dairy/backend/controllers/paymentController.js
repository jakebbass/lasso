const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/orderModel');

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, order_id } = req.body;
    
    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents for Stripe
      currency: 'usd',
      metadata: {
        order_id: order_id || 'no_order',
        user_id: req.user._id.toString()
      }
    });
    
    // Update order with payment intent id if order_id is provided
    if (order_id) {
      const order = await Order.findById(order_id);
      if (order) {
        order.payment_id = paymentIntent.id;
        await order.save();
      }
    }
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Webhook for Stripe events
// @route   POST /api/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
  let event;
  
  try {
    // Verify webhook signature
    const signature = req.headers['stripe-signature'];
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handler for payment_intent.succeeded event
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    const { order_id } = paymentIntent.metadata;
    
    if (order_id && order_id !== 'no_order') {
      const order = await Order.findById(order_id);
      
      if (order) {
        order.payment_status = 'paid';
        order.payment_id = paymentIntent.id;
        await order.save();
      }
    }
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
};

// Handler for payment_intent.payment_failed event
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    const { order_id } = paymentIntent.metadata;
    
    if (order_id && order_id !== 'no_order') {
      const order = await Order.findById(order_id);
      
      if (order) {
        order.payment_status = 'failed';
        await order.save();
      }
    }
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
};

// @desc    Get payment status
// @route   GET /api/payments/:paymentId/status
// @access  Private
exports.getPaymentStatus = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentId);
    
    if (!paymentIntent) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check if this payment belongs to the logged in user or if user is admin
    if (paymentIntent.metadata.user_id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.status(200).json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert from cents
      created: paymentIntent.created,
      currency: paymentIntent.currency
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refund payment
// @route   POST /api/payments/:paymentId/refund
// @access  Private/Admin
exports.refundPayment = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: req.params.paymentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if partial refund
      reason: reason || 'requested_by_customer'
    });
    
    // Update order status if order_id is in the payment intent metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentId);
    
    if (paymentIntent.metadata.order_id && paymentIntent.metadata.order_id !== 'no_order') {
      const order = await Order.findById(paymentIntent.metadata.order_id);
      
      if (order) {
        order.payment_status = 'refunded';
        await order.save();
      }
    }
    
    res.status(200).json(refund);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
