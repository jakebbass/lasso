import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/supabaseClient';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    userCount: 0,
    orderCount: 0,
    productCount: 0,
    totalRevenue: 0,
    recentOrders: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardStats = await api.getDashboardStats();
        setStats(dashboardStats);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Sample data for charts (in a real app, this would come from the backend)
  const lineChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Revenue',
        data: [6500, 5900, 8000, 8100, 9600, 8800, 10000],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const barChartData = {
    labels: ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream', 'Ice Cream'],
    datasets: [
      {
        label: 'Products Sold',
        data: [120, 90, 70, 60, 50, 40],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const doughnutChartData = {
    labels: ['Completed', 'Processing', 'Cancelled'],
    datasets: [
      {
        label: 'Orders',
        data: [65, 30, 5],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Stat card component
  const StatCard = ({ title, value, icon, bgColor }) => (
    <div className={`${bgColor} rounded-lg shadow p-5 flex justify-between items-center`}>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <div className="text-white opacity-80">
        {icon}
      </div>
    </div>
  );

  const OrderStatusBadge = ({ status }) => {
    let bgColor = '';
    
    switch (status) {
      case 'completed':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'processing':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
      case 'pending':
        bgColor = 'bg-blue-100 text-blue-800';
        break;
      case 'cancelled':
        bgColor = 'bg-red-100 text-red-800';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Lasso Dairy admin dashboard.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.userCount}
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          bgColor="bg-blue-600"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.orderCount}
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          bgColor="bg-purple-600"
        />
        <StatCard 
          title="Total Products" 
          value={stats.productCount}
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          bgColor="bg-green-600"
        />
        <StatCard 
          title="Revenue" 
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor="bg-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
          <div className="h-64">
            <Line 
              data={lineChartData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Revenue ($)'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="h-64">
            <Bar 
              data={barChartData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Units Sold'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* More data displays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Order Status</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={doughnutChartData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link 
              to="/orders"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link to={`/orders/${order.id}`}>
                          #{order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.user?.first_name} {order.user?.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <OrderStatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No recent orders found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
