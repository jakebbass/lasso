-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to create a user profile after auth.users is created
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_user_profile_after_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.create_user_profile();

-- User addresses table
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product categories
CREATE TYPE product_category AS ENUM ('milk', 'cream', 'butter', 'cheese', 'yogurt', 'other');

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  size TEXT NOT NULL,
  category product_category NOT NULL,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product availability (inventory)
CREATE TABLE product_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  available_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, available_date)
);

-- Order status
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Recurring type
CREATE TYPE recurring_type AS ENUM ('none', 'daily', 'weekly', 'biweekly', 'monthly');

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_id TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  recurring_type recurring_type DEFAULT 'none',
  next_delivery_date DATE,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  category product_category NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample data for products
INSERT INTO products (name, description, price, size, category, image_url) VALUES
('Whole Milk', 'Fresh whole milk from grass-fed cows', 4.99, '1 gallon', 'milk', 'https://example.com/milk.jpg'),
('2% Milk', 'Low-fat milk, perfect for everyday use', 4.49, '1 gallon', 'milk', 'https://example.com/2milk.jpg'),
('Heavy Cream', 'Premium heavy whipping cream', 3.99, '16 oz', 'cream', 'https://example.com/cream.jpg'),
('Butter', 'Hand-churned salted butter', 5.99, '8 oz', 'butter', 'https://example.com/butter.jpg'),
('Greek Yogurt', 'Creamy plain Greek yogurt', 4.29, '32 oz', 'yogurt', 'https://example.com/yogurt.jpg'),
('Cheddar Cheese', 'Aged cheddar cheese', 6.99, '8 oz', 'cheese', 'https://example.com/cheddar.jpg');

-- Sample product availability data (next 14 days)
DO $$
DECLARE
  product_rec RECORD;
  current_date DATE := CURRENT_DATE;
  availability_date DATE;
BEGIN
  FOR product_rec IN SELECT id FROM products LOOP
    FOR i IN 0..14 LOOP
      availability_date := current_date + i;
      INSERT INTO product_availability (product_id, available_date, quantity)
      VALUES (product_rec.id, availability_date, 50 + (random() * 50)::INT);
    END LOOP;
  END LOOP;
END $$;

-- RLS Policies

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_availability ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- User addresses policies
CREATE POLICY "Users can view their own addresses"
  ON user_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (active = true);

-- Product availability policies (public read, admin write)
CREATE POLICY "Anyone can view product availability"
  ON product_availability FOR SELECT
  TO authenticated
  USING (true);

-- Orders policies
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own order items"
  ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));
