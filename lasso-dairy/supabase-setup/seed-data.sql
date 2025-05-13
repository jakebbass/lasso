-- Seed data for Lasso Dairy Supabase Database
-- Run this after setting up the database schema

-- Insert admin user
INSERT INTO users (id, email, password_hash, name, role)
VALUES (
  uuid_generate_v4(),
  'admin@lassodairy.com',
  -- This is a placeholder hash for 'admin123' - in production, use proper password hashing
  '$2a$10$5DxqalP4LYOtV/zuGNpSaeKMqifDRfV9IaGE/5CBbKLY8Zlu/zxlO',
  'Admin User',
  'admin'
);

-- Insert sample products
INSERT INTO products (id, name, size, price, description, category, active)
VALUES 
  (
    uuid_generate_v4(),
    'Whole Milk',
    'gallon',
    5.99,
    'Fresh whole milk from grass-fed cows, non-homogenized.',
    'milk',
    true
  ),
  (
    uuid_generate_v4(),
    'Whole Milk',
    'half-gallon',
    3.49,
    'Fresh whole milk from grass-fed cows, non-homogenized.',
    'milk',
    true
  ),
  (
    uuid_generate_v4(),
    'Skim Milk',
    'gallon',
    5.49,
    'Fresh skim milk with a light, clean taste.',
    'milk',
    true
  ),
  (
    uuid_generate_v4(),
    'Skim Milk',
    'half-gallon',
    3.29,
    'Fresh skim milk with a light, clean taste.',
    'milk',
    true
  ),
  (
    uuid_generate_v4(),
    '2% Milk',
    'gallon',
    5.79,
    'Fresh 2% milk, perfect balance of taste and reduced fat.',
    'milk',
    true
  ),
  (
    uuid_generate_v4(),
    '2% Milk',
    'half-gallon',
    3.39,
    'Fresh 2% milk, perfect balance of taste and reduced fat.',
    'milk',
    true
  ),
  (
    uuid_generate_v4(),
    'Chocolate Milk',
    'quart',
    2.99,
    'Delicious chocolate milk made with real cocoa.',
    'milk',
    true
  ),
  (
    uuid_generate_v4(),
    'Heavy Cream',
    'quart',
    4.99,
    'Rich heavy cream, perfect for cooking and baking.',
    'cream',
    true
  ),
  (
    uuid_generate_v4(),
    'Half & Half',
    'quart',
    3.49,
    'Versatile half & half, perfect for coffee and cooking.',
    'cream',
    true
  );

-- Initialize product availability for the next 30 days
DO $$
DECLARE
  product_record RECORD;
  current_date DATE := CURRENT_DATE;
  end_date DATE := CURRENT_DATE + INTERVAL '30 days';
  loop_date DATE;
  random_quantity INTEGER;
BEGIN
  -- For each product
  FOR product_record IN SELECT id FROM products LOOP
    -- For each date in the next 30 days
    loop_date := current_date;
    WHILE loop_date <= end_date LOOP
      -- Generate a random quantity between 20 and 100
      random_quantity := floor(random() * 81 + 20);
      
      -- Insert product availability
      INSERT INTO product_availability (product_id, available_date, quantity)
      VALUES (product_record.id, loop_date, random_quantity);
      
      loop_date := loop_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

-- Create a sample customer
INSERT INTO users (id, email, password_hash, name, phone, street, city, state, zip_code, country, role)
VALUES (
  uuid_generate_v4(),
  'customer@example.com',
  -- This is a placeholder hash for 'customer123' - in production, use proper password hashing
  '$2a$10$qp1m73bUL4nLVvXhZtdOFeDwdpEQ3TzF/gBIWg8vpZ9QN7XbdZXkG',
  'John Doe',
  '555-123-4567',
  '123 Main St',
  'Anytown',
  'TX',
  '78701',
  'USA',
  'customer'
);

-- Get IDs for creating sample orders
DO $$
DECLARE
  customer_id UUID;
  product1_id UUID;
  product2_id UUID;
  order_id UUID;
BEGIN
  -- Get customer ID
  SELECT id INTO customer_id FROM users WHERE email = 'customer@example.com' LIMIT 1;
  
  -- Get product IDs
  SELECT id INTO product1_id FROM products WHERE name = 'Whole Milk' AND size = 'gallon' LIMIT 1;
  SELECT id INTO product2_id FROM products WHERE name = 'Heavy Cream' AND size = 'quart' LIMIT 1;
  
  -- Create a sample order
  INSERT INTO orders (
    id, user_id, delivery_date, total_amount, payment_status, 
    status, recurring, recurring_type, street, city, state, zip_code, country
  )
  VALUES (
    uuid_generate_v4(),
    customer_id,
    CURRENT_DATE + INTERVAL '3 days',
    0, -- Will be calculated by trigger
    'pending',
    'pending',
    true,
    'weekly',
    '123 Main St',
    'Anytown',
    'TX',
    '78701',
    'USA'
  )
  RETURNING id INTO order_id;
  
  -- Add order items
  INSERT INTO order_items (order_id, product_id, quantity, price, name, size, category)
  VALUES
    (order_id, product1_id, 2, 5.99, 'Whole Milk', 'gallon', 'milk'),
    (order_id, product2_id, 1, 4.99, 'Heavy Cream', 'quart', 'cream');
END $$;
