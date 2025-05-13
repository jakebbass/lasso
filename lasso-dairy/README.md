# Lasso Dairy App

A full-stack dairy delivery service application built with React Native and Supabase.

## Project Structure

```
lasso-dairy/
├── assets/               # Static assets like images and icons
├── backend/              # Backend Node.js server (optional, as primary backend is Supabase)
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Middleware functions
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── services/         # Business logic services
├── database/             # Database schema and migrations
│   └── schema.sql        # SQL schema definition for Supabase
├── mobile-app/           # React Native mobile application
│   ├── src/              # Source code
│   │   ├── assets/       # App-specific assets
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts for state management
│   │   ├── hooks/        # Custom React hooks
│   │   ├── navigation/   # Navigation configuration
│   │   ├── screens/      # Application screens
│   │   ├── services/     # API and service integrations
│   │   └── utils/        # Utility functions and helpers
│   ├── App.js            # Main application component
│   └── app.json          # App configuration
└── web-dashboard/        # Admin web dashboard (future expansion)
    ├── public/           # Static files
    └── src/              # Source code
```

## Mobile App Features

- User authentication (sign up, login, password reset)
- Product browsing and filtering
- Shopping cart functionality
- Order placement and history
- User profile management
- Delivery scheduling

## Database Schema

The application uses Supabase (PostgreSQL) as its database with the following tables:

- `users` - User profiles
- `user_addresses` - User delivery addresses
- `products` - Dairy products catalog
- `product_availability` - Inventory and availability tracking
- `orders` - Customer orders
- `order_items` - Individual items in each order

## Environment Configuration

The mobile app uses environment variables stored in `.env` for configuration:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Setup Instructions

1. **Backend (Supabase)**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql` in the SQL editor
   - Configure authentication providers as needed

2. **Mobile App**
   - Install dependencies: `cd mobile-app && npm install`
   - Create `.env` file with Supabase credentials
   - Run the app: `npm start`

## Authentication Flow

The app uses Supabase Auth with the following flow:
1. User signs up or logs in
2. Auth state is managed through AuthContext
3. Protected routes/screens are only accessible to authenticated users
4. User profile data is stored in the `users` table

## License

This project is proprietary and confidential.
