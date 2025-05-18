import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/supabaseClient';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await api.getOrderById(id);
      
      if (!orderData) {
        setError('Order not found.');
        return;
      }
      
      setOrder(orderData);
      setNewStatus(orderData.status);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === order.status) return;

    try {
      setStatusUpdating(true);
      await api.updateOrderStatus(id, newStatus);
      
      // Update local state
      setOrder({
        ...order,
        status: newStatus
      });
      
      // Show success message (could use a toast notification here)
      alert('Order status updated successfully.');
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
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
          <p className="mt-2">Loading order details...</p>
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
            onClick={() => navigate('/orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
        <p className="font-bold">Order Not Found</p>
        <p>The requested order could not be found.</p>
        <div className="mt-4">
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Back to Orders
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
              to="/orders"
              className="mr-2 text-blue-600 hover:text-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_id}</h1>
          </div>
          <p className="text-gray-600">Placed on {formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center">
          <span className="mr-2 text-sm font-medium text-gray-600">Status:</span>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="mr-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={statusUpdating}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={newStatus === order.status || statusUpdating}
            className={`py-2 px-4 rounded text-white ${
              newStatus === order.status || statusUpdating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {statusUpdating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
            </div>
            <div className="p-6">
              <div className="flex justify-between mb-4 pb-4 border-b">
                <div>
                  <p className="mb-1 font-medium">Status</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="mb-1 font-medium">Order ID</p>
                  <p className="text-gray-600">{order.order_id}</p>
                </div>
                <div>
                  <p className="mb-1 font-medium">Order Date</p>
                  <p className="text-gray-600">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="mb-1 font-medium">Payment Method</p>
                  <p className="text-gray-600">{order.payment_method || 'Credit Card'}</p>
                </div>
              </div>
              
              <h3 className="text-md font-medium mb-3">Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-md mr-4"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{item.name}</div>
                              {item.variant && <div className="text-sm text-gray-500">{item.variant}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          ${parseFloat(item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between mb-2">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">${parseFloat(order.subtotal || order.total_amount).toFixed(2)}</p>
                </div>
                {order.shipping_cost && (
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Shipping</p>
                    <p className="font-medium">${parseFloat(order.shipping_cost).toFixed(2)}</p>
                  </div>
                )}
                {order.tax_amount && (
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Tax</p>
                    <p className="font-medium">${parseFloat(order.tax_amount).toFixed(2)}</p>
                  </div>
                )}
                {order.discount_amount && (
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Discount</p>
                    <p className="font-medium text-green-600">-${parseFloat(order.discount_amount).toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <p className="font-bold">Total</p>
                  <p className="font-bold text-lg">${parseFloat(order.total_amount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Customer</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-medium mb-2">Contact Information</h3>
                <p className="text-gray-800 mb-1">{order.customer_name}</p>
                <p className="text-gray-600 mb-1">{order.customer_email}</p>
                {order.customer_phone && (
                  <p className="text-gray-600">{order.customer_phone}</p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Shipping Address</h3>
                <p className="text-gray-800 mb-1">{order.shipping_address?.recipient || order.customer_name}</p>
                <p className="text-gray-600 mb-1">{order.shipping_address?.line1}</p>
                {order.shipping_address?.line2 && (
                  <p className="text-gray-600 mb-1">{order.shipping_address.line2}</p>
                )}
                <p className="text-gray-600">
                  {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}
                </p>
                <p className="text-gray-600">{order.shipping_address?.country}</p>
              </div>
              
              {order.billing_address && order.billing_address.line1 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-2">Billing Address</h3>
                  <p className="text-gray-800 mb-1">{order.billing_address?.recipient || order.customer_name}</p>
                  <p className="text-gray-600 mb-1">{order.billing_address?.line1}</p>
                  {order.billing_address?.line2 && (
                    <p className="text-gray-600 mb-1">{order.billing_address.line2}</p>
                  )}
                  <p className="text-gray-600">
                    {order.billing_address?.city}, {order.billing_address?.state} {order.billing_address?.postal_code}
                  </p>
                  <p className="text-gray-600">{order.billing_address?.country}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Order
                </button>
                
                <button
                  onClick={() => {/* Email functionality would go here */}}
                  className="flex items-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Order to Customer
                </button>
                
                {order.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                        setNewStatus('cancelled');
                        handleStatusUpdate();
                      }
                    }}
                    className="flex items-center w-full py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
