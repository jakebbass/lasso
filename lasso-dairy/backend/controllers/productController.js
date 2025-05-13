const Product = require('../models/productModel');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const category = req.query.category;
    const filter = category ? { category, active: true } : { active: true };
    
    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { name, size, price, description, imageUrl, category, availability_by_date } = req.body;
    
    const product = await Product.create({
      name,
      size,
      price,
      description,
      imageUrl,
      category,
      availability_by_date
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { name, size, price, description, imageUrl, category, active, availability_by_date } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update product fields
    product.name = name || product.name;
    product.size = size || product.size;
    product.price = price !== undefined ? price : product.price;
    product.description = description || product.description;
    product.imageUrl = imageUrl || product.imageUrl;
    product.category = category || product.category;
    product.active = active !== undefined ? active : product.active;
    
    // Update availability if provided
    if (availability_by_date) {
      for (const [date, quantity] of Object.entries(availability_by_date)) {
        product.availability_by_date.set(date, quantity);
      }
    }
    
    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await product.remove();
    res.status(200).json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product availability for next 7 days
// @route   GET /api/products/availability
// @access  Public
exports.getProductAvailability = async (req, res) => {
  try {
    const products = await Product.find({ active: true });
    const availability = {};
    
    // Get dates for the next 7 days
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]); // Format: YYYY-MM-DD
    }
    
    // Collect availability for each product on each date
    products.forEach(product => {
      availability[product._id] = {};
      
      dates.forEach(date => {
        availability[product._id][date] = product.availability_by_date.get(date) || 0;
      });
    });
    
    res.status(200).json({ dates, availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product availability in bulk
// @route   PUT /api/products/availability
// @access  Private/Admin
exports.updateProductAvailability = async (req, res) => {
  try {
    const { productAvailability } = req.body;
    
    if (!productAvailability || typeof productAvailability !== 'object') {
      return res.status(400).json({ message: 'Invalid availability data' });
    }
    
    const updates = [];
    
    // Process each product's availability updates
    for (const [productId, dateQuantities] of Object.entries(productAvailability)) {
      const product = await Product.findById(productId);
      
      if (!product) {
        continue; // Skip if product not found
      }
      
      // Update availability for each date
      for (const [date, quantity] of Object.entries(dateQuantities)) {
        product.availability_by_date.set(date, quantity);
      }
      
      // Save the updated product
      updates.push(product.save());
    }
    
    // Wait for all updates to complete
    await Promise.all(updates);
    
    res.status(200).json({ message: 'Product availability updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
