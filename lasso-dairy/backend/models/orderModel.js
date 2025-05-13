const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  products: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true
      },
      name: String,
      size: String,
      category: String
    }
  ],
  order_date: {
    type: Date,
    default: Date.now
  },
  delivery_date: {
    type: Date,
    required: true
  },
  total_amount: {
    type: Number,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_id: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  recurring: {
    type: Boolean,
    default: false
  },
  recurring_type: {
    type: String,
    enum: ['weekly', 'biweekly', 'none'],
    default: 'none'
  },
  next_delivery_date: {
    type: Date
  },
  delivery_address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total order amount before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('products')) {
    this.total_amount = this.products.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  
  // If recurring, calculate the next delivery date
  if (this.recurring && this.delivery_date) {
    const deliveryDate = new Date(this.delivery_date);
    
    if (this.recurring_type === 'weekly') {
      deliveryDate.setDate(deliveryDate.getDate() + 7);
    } else if (this.recurring_type === 'biweekly') {
      deliveryDate.setDate(deliveryDate.getDate() + 14);
    }
    
    this.next_delivery_date = deliveryDate;
  }
  
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
