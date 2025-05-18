import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/supabaseClient';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
  });

  useEffect(() => {
    fetchUserDetails();
    fetchUserOrders();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const userData = await api.getUserById(id);
      
      if (!userData) {
        setError('User not found.');
        return;
      }
      
      setUser(userData);
      
      // Initialize edit form with user data
      setEditForm({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'customer',
        address: {
          line1: userData.address?.line1 || '',
          line2: userData.address?.line2 || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          postal_code: userData.address?.postal_code || '',
          country: userData.address?.country || '',
        },
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const ordersData = await api.getUserOrders(id);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching user orders:', err);
      // Don't show an error for orders, just log it
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setEditForm({
        ...editForm,
        address: {
          ...editForm.address,
          [addressField]: value,
        },
      });
    } else {
      setEditForm({
        ...editForm,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.updateUser(id, editForm);
      
      // Update local state
      setUser({
        ...user,
        ...editForm,
      });
      
      setIsEditing(false);
      alert('User updated successfully');
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    }
  };

  const handleBanUser = async () => {
    try {
      await api.banUser(id);
      
      // Update local state
      setUser({
        ...user,
        banned: true,
      });
      
      alert('User banned successfully');
    } catch (err) {
      console.error('Error banning user:', err);
      setError('Failed to ban user. Please try again.');
    }
  };

  const handleUnbanUser = async () => {
    try {
      await api.unbanUser(id);
      
      // Update local state
      setUser({
        ...user,
        banned: false,
      });
      
      alert('User unbanned successfully');
    } catch (err) {
      console.error('Error unbanning user:', err);
      setError('Failed to unban user. Please try again.');
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.deleteUser(id);
      navigate('/users');
      alert('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getOrderStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <div className="mt-4">
          <button
            onClick={() => navigate('/users')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
        <p className="font-bold">User Not Found</p>
        <p>The requested user could not be found.</p>
        <div className="mt-4">
          <button
            onClick={() => navigate('/users')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <Link
              to="/users"
              className="mr-2 text-blue-600 hover:text-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
          </div>
          <p className="text-gray-600">View and manage user information</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Edit User
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">User Information</h2>
              {!isEditing && (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {user.banned ? 'Banned' : 'Active'}
                </span>
              )}
            </div>
            
            {isEditing ? (
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={editForm.full_name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={editForm.role}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="customer">Customer</option>
                        <option value="guest">Guest</option>
                      </select>
                    </div>
                  </div>
                  
                  <h3 className="text-md font-medium mt-4 mb-3">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label htmlFor="address.line1" className="block text-sm font-medium text-gray-700">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        id="address.line1"
                        name="address.line1"
                        value={editForm.address.line1}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="address.line2" className="block text-sm font-medium text-gray-700">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        id="address.line2"
                        name="address.line2"
                        value={editForm.address.line2}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        id="address.city"
                        name="address.city"
                        value={editForm.address.city}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                        State/Province
                      </label>
                      <input
                        type="text"
                        id="address.state"
                        name="address.state"
                        value={editForm.address.state}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="address.postal_code" className="block text-sm font-medium text-gray-700">
                        ZIP/Postal Code
                      </label>
                      <input
                        type="text"
                        id="address.postal_code"
                        name="address.postal_code"
                        value={editForm.address.postal_code}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        type="text"
                        id="address.country"
                        name="address.country"
                        value={editForm.address.country}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Role</h3>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'customer' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role || 'customer'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Joined On</h3>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Login</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}</p>
                  </div>
                </div>
                
                {(user.address?.line1 || user.address?.city) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-base font-medium mb-4">Address Information</h3>
                    <div className="text-sm text-gray-900">
                      <p>{user.address?.line1}</p>
                      {user.address?.line2 && <p>{user.address.line2}</p>}
                      <p>
                        {user.address?.city}{user.address?.city && user.address?.state && ','} {user.address?.state} {user.address?.postal_code}
                      </p>
                      <p>{user.address?.country}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            </div>
            <div className="p-6">
              {orders.length === 0 ? (
                <p className="text-gray-500 italic">This user has no orders.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              <Link to={`/orders/${order.id}`}>{order.order_id}</Link>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(order.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${parseFloat(order.total_amount).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/orders/${order.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {orders.length > 5 && (
                <div className="mt-4 text-right">
                  <Link
                    to="/orders"
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    View All Orders
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* User Actions */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  {isEditing ? 'Cancel Editing' : 'Edit User'}
                </button>
                
                <Link
                  to={`/orders?user=${id}`}
                  className="flex items-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  View All Orders
                </Link>
                
                {user.banned ? (
                  <button
                    onClick={handleUnbanUser}
                    className="flex items-center w-full py-2 px-4 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50"
                  >
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Unban User
                  </button>
                ) : (
                  <button
                    onClick={handleBanUser}
                    className="flex items-center w-full py-2 px-4 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50"
                  >
                    <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Ban User
                  </button>
                )}
                
                <button
                  onClick={handleDeleteUser}
                  className="flex items-center w-full py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete User
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Account Information</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                  <p className="mt-1 text-sm text-gray-900 break-all">{user.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.banned ? 'Banned' : 'Active'}
                    </span>
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email Verified</h3>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.email_confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user.email_confirmed ? 'Verified' : 'Not Verified'}
                    </span>
                  </p>
                </div>
                
                {user.last_login_ip && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Login IP</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.last_login_ip}</p>
                  </div>
                )}
                
                {user.login_count !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Login Count</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.login_count}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
