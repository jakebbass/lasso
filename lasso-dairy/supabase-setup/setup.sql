-- Supabase Database Setup Script for Lasso Dairy
-- This script creates the tables needed for the Lasso Dairy application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  size VARCHAR(20) NOT NULL CHECK (size IN ('half-gallon', 'gallon', 'quart')),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  image_url VARCHAR(255),
  category VARCHAR(50) NOT NULL CHECK (category IN ('milk', 'cream')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_availability table to replace the Map in the Mongoose model
CREATE TABLE IF NOT EXISTS product_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, available_date)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
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
);

-- Create order_items table (replaces the embedded products array in Mongoose)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  name VARCHAR(255) NOT NULL,
  size VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
-- Users can view and update only their own data
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Products are viewable by everyone
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (TRUE);

-- Only admin users can create/update products
CREATE POLICY "Admin users can modify products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Product availability is viewable by everyone
CREATE POLICY "Product availability is viewable by everyone"
  ON product_availability FOR SELECT
  USING (TRUE);

-- Only admin users can modify product availability
CREATE POLICY "Admin users can modify product availability"
  ON product_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Orders are viewable by the user who created them and admin users
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders if status is pending
CREATE POLICY "Users can update their own pending orders"
  ON orders FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Admin users can update any order
CREATE POLICY "Admin users can update any order"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Order items policies
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create or replace functions for product availability management

-- Function to check product availability for a given date
CREATE OR REPLACE FUNCTION check_product_availability(
  product_id UUID,
  check_date DATE,
  required_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  available INTEGER;
BEGIN
  SELECT quantity INTO available
  FROM product_availability
  WHERE product_availability.product_id = check_product_availability.product_id
  AND available_date = check_date;
  
  IF available IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN available >= required_quantity;
END;
$$;

-- Function to update product availability after order
CREATE OR REPLACE FUNCTION update_product_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  order_delivery_date DATE;
BEGIN
  -- Get the delivery date from the order
  SELECT delivery_date INTO order_delivery_date
  FROM orders
  WHERE id = NEW.order_id;
  
  -- Update the product availability
  UPDATE product_availability
  SET quantity = GREATEST(quantity - NEW.quantity, 0)
  WHERE product_id = NEW.product_id
  AND available_date = order_delivery_date;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update product availability when a new order item is created
CREATE TRIGGER trigger_update_product_availability
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_availability();

-- Create function for calculating order total
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total DECIMAL(10, 2);
BEGIN
  -- Calculate total from order items
  SELECT SUM(price * quantity) INTO total
  FROM order_items
  WHERE order_id = NEW.id;
  
  -- Update the order with the calculated total
  UPDATE orders
  SET total_amount = total
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to calculate order total when an order is created
CREATE TRIGGER trigger_calculate_order_total
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_total();

-- Create function to handle recurring orders
CREATE OR REPLACE FUNCTION set_next_delivery_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.recurring = TRUE AND NEW.delivery_date IS NOT NULL THEN
    IF NEW.recurring_type = 'weekly' THEN
      NEW.next_delivery_date := NEW.delivery_date + INTERVAL '7 days';
    ELSIF NEW.recurring_type = 'biweekly' THEN
      NEW.next_delivery_date := NEW.delivery_date + INTERVAL '14 days';
    END IF;
  ELSE
    NEW.next_delivery_date := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to set next delivery date for recurring orders
CREATE TRIGGER trigger_set_next_delivery_date
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_next_delivery_date();

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_product_availability_product_date ON product_availability(product_id, available_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
