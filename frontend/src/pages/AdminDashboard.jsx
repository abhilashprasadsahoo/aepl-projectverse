import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.stats);
      setRecentOrders(response.data.recentOrders);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-primary-600">{stats?.totalUsers || 0}</div>
            <div className="text-gray-600">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-secondary-600">{stats?.totalProjects || 0}</div>
            <div className="text-gray-600">Total Projects</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">{stats?.totalOrders || 0}</div>
            <div className="text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-yellow-600">₹{stats?.totalRevenue || 0}</div>
            <div className="text-gray-600">Total Revenue</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/admin/projects" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">Manage Projects</h3>
            <p className="text-gray-600">Add, edit, or remove projects</p>
          </Link>
          <Link to="/admin/users" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">Manage Users</h3>
            <p className="text-gray-600">View and manage user accounts</p>
          </Link>
          <Link to="/admin/orders" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">View Transactions</h3>
            <p className="text-gray-600">View all payment transactions</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Project</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-b">
                      <td className="py-3 px-4">
                        <div>{order.user_id?.name}</div>
                        <div className="text-sm text-gray-500">{order.user_id?.email}</div>
                      </td>
                      <td className="py-3 px-4">{order.project_id?.title}</td>
                      <td className="py-3 px-4">₹{order.amount}</td>
                      <td className="py-3 px-4">
                        {new Date(order.purchase_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
