# Lasso Dairy Supabase Database Setup

This directory contains scripts to set up the database schema for the Lasso Dairy application using Supabase.

## Supabase Credentials

- URL: `https://mnqmjrftcvuimfiredvd.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucW1qcmZ0Y3Z1aW1maXJlZHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMTAxMTEsImV4cCI6MjA2MjY4NjExMX0.mkkz0cjdgRrlVPiy5TLvG8wyHTsI7HEIyxPN7S-fzyo`

## Database Structure

The database schema is designed to support the Lasso Dairy application with the following tables:

1. **users** - Stores user account information
2. **products** - Stores dairy product information
3. **product_availability** - Tracks product availability by date
4. **orders** - Stores order information
5. **order_items** - Stores individual items within an order

## Setup Instructions

### Option 1: Using the SQL Script (Recommended)

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Copy the contents of `setup.sql` and paste it into the SQL Editor
5. Run the script

### Option 2: Using the JavaScript Script

1. Make sure you have Node.js installed
2. Install the dependencies by running:
   ```
   npm install
   ```
3. Run the setup script:
   ```
   node setup.js
   ```

### Seed Data

After setting up the database schema, you can populate your database with sample data:

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Copy the contents of `seed-data.sql` and paste it into the SQL Editor
5. Run the script

This will create:
- An admin user (admin@lassodairy.com)
- A customer user (customer@example.com)
- Sample dairy products
- Product availability for the next 30 days
- A sample order

## Database Schema Details

### Users Table
- `id`: UUID, primary key
- `email`: String, unique, required
- `password_hash`: String, required
- `phone`: String, optional
- `name`: String, required
- `street`, `city`, `state`, `zip_code`, `country`: Address fields
- `role`: String, either 'customer' or 'admin'
- `created_at`, `updated_at`: Timestamps

### Products Table
- `id`: UUID, primary key
- `name`: String, required
- `size`: String, required ('half-gallon', 'gallon', 'quart')
- `price`: Decimal, required
- `description`: Text, optional
- `image_url`: String, optional
- `category`: String, required ('milk', 'cream')
- `active`: Boolean, default true
- `created_at`, `updated_at`: Timestamps

### Product_Availability Table
- `id`: UUID, primary key
- `product_id`: UUID, foreign key to products
- `available_date`: Date, required
- `quantity`: Integer, required
- `created_at`, `updated_at`: Timestamps
- Unique constraint on product_id and available_date

### Orders Table
- `id`: UUID, primary key
- `user_id`: UUID, foreign key to users
- `order_date`: Timestamp, default now
- `delivery_date`: Date, required
- `total_amount`: Decimal, required
- `payment_status`: String ('pending', 'paid', 'failed', 'refunded')
- `payment_id`: String, optional
- `status`: String ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
- `recurring`: Boolean, default false
- `recurring_type`: String ('weekly', 'biweekly', 'none')
- `next_delivery_date`: Date, optional
- Address fields
- `notes`: Text, optional
- `created_at`, `updated_at`: Timestamps

### Order_Items Table
- `id`: UUID, primary key
- `order_id`: UUID, foreign key to orders
- `product_id`: UUID, foreign key to products
- `quantity`: Integer, required
- `price`: Decimal, required
- `name`, `size`, `category`: Product details
- `created_at`, `updated_at`: Timestamps

## Security

Row Level Security (RLS) policies are implemented to ensure that:

1. Users can only access their own data
2. Admin users have broader access
3. Products are viewable by everyone
4. Orders are only viewable by the user who created them and admin users

## Functions and Triggers

The database includes several functions and triggers to handle:

1. Checking product availability
2. Updating product availability when orders are placed
3. Calculating order totals
4. Setting next delivery dates for recurring orders
