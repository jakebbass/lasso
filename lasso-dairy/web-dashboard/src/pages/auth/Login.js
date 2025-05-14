import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const { success, error } = await signIn(email, password);
      
      if (!success) {
        throw new Error(error.message || 'Failed to sign in');
      }
      
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Admin Login</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to manage the Lasso Dairy platform
            </p>
          </div>
          
          <div className="mt-8">
            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}
            
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>
                  
                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative flex-1 hidden w-0 lg:block">
        <img
          className="absolute inset-0 object-cover w-full h-full"
          src="/images/dairy-farm.jpg"
          alt="Dairy Farm"
        />
      </div>
    </div>
  );
};

export default Login;
