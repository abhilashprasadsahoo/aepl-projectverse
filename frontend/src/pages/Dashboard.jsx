import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getMyOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (projectId, fileType) => {
    try {
      const response = await ordersAPI.getDownload(projectId);
      const fileUrl = `${response.data.downloadBaseUrl}?projectId=${projectId}&fileType=${fileType}`;
      window.open(fileUrl, '_blank');
    } catch (error) {
      alert(error.response?.data?.message || 'Error downloading file');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-primary-600">{orders.length}</div>
            <div className="text-gray-600">Projects Purchased</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">
              ₹{orders.reduce((sum, order) => sum + (order.amount || 0), 0)}
            </div>
            <div className="text-gray-600">Total Spent</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-secondary-600">
              {orders.filter(o => new Date(o.purchase_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </div>
            <div className="text-gray-600">This Month</div>
          </div>
        </div>

        {/* Purchased Projects */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">My Purchased Projects</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order._id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <Link to={`/project/${order.project?._id}`} className="text-lg font-semibold hover:text-primary-600">
                        {order.project?.title}
                      </Link>
                      <p className="text-gray-600 text-sm">{order.project?.short_description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Purchased on: {new Date(order.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">₹{order.amount}</div>
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        Paid
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Download Files:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleDownload(order.project?._id, 'source_code')}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                      >
                        📁 Source Code
                      </button>
                      <button
                        onClick={() => handleDownload(order.project?._id, 'documentation')}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                      >
                        📄 Documentation
                      </button>
                      <button
                        onClick={() => handleDownload(order.project?._id, 'project_report')}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                      >
                        📊 Project Report
                      </button>
                      <button
                        onClick={() => handleDownload(order.project?._id, 'demo_video')}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                      >
                        🎥 Demo Video
                      </button>
                      <button
                        onClick={() => handleDownload(order.project?._id, 'readme')}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                      >
                        📖 Readme
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You haven't purchased any projects yet.</p>
              <Link to="/browse" className="btn btn-primary">
                Browse Projects
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
