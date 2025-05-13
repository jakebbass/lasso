// Supabase Database Setup Script for Lasso Dairy
// This script creates the tables needed for the Lasso Dairy application
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://mnqmjrftcvuimfiredvd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucW1qcmZ0Y3Z1aW1maXJlZHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMTAxMTEsImV4cCI6MjA2MjY4NjExMX0.mkkz0cjdgRrlVPiy5TLvG8wyHTsI7HEIyxPN7S-fzyo';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to run database setup
async function setupDatabase() {
  console.log('Starting Supabase database setup...');

  try {
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'users',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        name VARCHAR(255) NOT NULL,
        street VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        country VARCHAR(50) DEFAULT 'USA',
        role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      `
    });

    if (usersError) throw usersError;
    
    // Create products table
    console.log('Creating products table...');
    const { error: productsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'products',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        size VARCHAR(20) NOT NULL CHECK (size IN ('half-gallon', 'gallon', 'quart')),
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        description TEXT,
        image_url VARCHAR(255),
        category VARCHAR(50) NOT NULL CHECK (category IN ('milk', 'cream')),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      `
    });

    if (productsError) throw productsError;

    // Create product_availability table
    console.log('Creating product_availability table...');
    const { error: availabilityError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'product_availability',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id uuid REFERENCES products(id) ON DELETE CASCADE,
        available_date DATE NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (product_id, available_date)
      `
    });

    if (availabilityError) throw availabilityError;

    // Create orders table
    console.log('Creating orders table...');
    const { error: ordersError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'orders',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
        order_date TIMESTAMPTZ DEFAULT NOW(),
        delivery_date DATE NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        payment_id VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
        recurring BOOLEAN DEFAULT FALSE,
        recurring_type VARCHAR(20) DEFAULT 'none' CHECK (recurring_type IN ('weekly', 'biweekly', 'none')),
        next_delivery_date DATE,
        street VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        country VARCHAR(50) DEFAULT 'USA',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      `
    });

    if (ordersError) throw ordersError;

    // Create order_items table
    console.log('Creating order_items table...');
    const { error: orderItemsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'order_items',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
        product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price DECIMAL(10, 2) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size VARCHAR(20) NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      `
    });

    if (orderItemsError) throw orderItemsError;

    // Create RLS policies
    console.log('Setting up Row Level Security policies...');
    
    // Enable RLS on all tables
    await supabase.rpc('enable_rls', { table_name: 'users' });
    await supabase.rpc('enable_rls', { table_name: 'products' });
    await supabase.rpc('enable_rls', { table_name: 'product_availability' });
    await supabase.rpc('enable_rls', { table_name: 'orders' });
    await supabase.rpc('enable_rls', { table_name: 'order_items' });

    // Create policies - these would be custom based on your exact requirements
    // For example, users can only see their own data
    await supabase.rpc('create_policy', {
      table_name: 'users',
      policy_name: 'users_individual_access',
      definition: "auth.uid() = id"
    });

    // Products are viewable by anyone
    await supabase.rpc('create_policy', {
      table_name: 'products',
      policy_name: 'products_public_view',
      definition: "TRUE",
      action: "SELECT"
    });

    // Setup completed successfully
    console.log('Database setup completed successfully!');

  } catch (error) {
    console.error('Error setting up database:', error.message);
  }
}

// Execute the database setup
setupDatabase();
