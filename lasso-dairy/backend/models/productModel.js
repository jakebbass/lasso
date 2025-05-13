const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  size: {
    type: String,
    required: [true, 'Product size is required'],
    enum: ['half-gallon', 'gallon', 'quart']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
  },
  availability_by_date: {
    type: Map,
    of: Number,
    default: {}
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['milk', 'cream']
  },
  active: {
    type: Boolean,
    default: true
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

// Method to check product availability for a given date
productSchema.methods.isAvailable = function(date, quantity) {
  const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const available = this.availability_by_date.get(dateString) || 0;
  return available >= quantity;
};

// Method to update product availability
productSchema.methods.updateAvailability = function(date, quantity) {
  const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const currentAvailability = this.availability_by_date.get(dateString) || 0;
  this.availability_by_date.set(dateString, Math.max(0, currentAvailability - quantity));
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
