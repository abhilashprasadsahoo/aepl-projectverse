import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, ordersAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchasedData, setPurchasedData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await projectsAPI.getById(id);
      setProject(response.data.project);
      
      if (isAuthenticated) {
        const purchaseCheck = await projectsAPI.checkPurchase(id);
        setHasPurchased(purchaseCheck.data.hasPurchased);
        setPurchasedData(purchaseCheck.data.order);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setProcessingPayment(true);
    try {
      // Create order
      const orderResponse = await ordersAPI.createOrder(id);
      const { order, key_id } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: key_id,
        amount: order.amount,
        currency: 'INR',
        name: 'AEPL-PROJECTVERSE',
        description: `Purchase ${project.title}`,
        order_id: order.razorpay_order_id,
        handler: async (response) => {
          try {
            // Verify payment
            await ordersAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            alert('Payment successful! You can now access the project files.');
            setHasPurchased(true);
            fetchProject();
          } catch (error) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: isAuthenticated?.name || '',
          email: isAuthenticated?.email || ''
        },
        theme: {
          color: '#0ea5e9'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewsAPI.create({
        projectId: id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      alert('Review submitted successfully!');
      fetchProject();
      setReviewData({ rating: 5, comment: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownload = async (fileType) => {
    try {
      const response = await ordersAPI.getDownload(id);
      const fileUrl = `${response.data.downloadBaseUrl}?projectId=${id}&fileType=${fileType}`;
      window.open(fileUrl, '_blank');
    } catch (error) {
      alert(error.response?.data?.message || 'Error downloading file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <button onClick={() => navigate('/browse')} className="btn btn-primary">
            Browse Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {project.preview?.screenshot_urls?.[0] && (
              <div className="md:w-1/2">
                <img
                  src={project.preview.screenshot_urls[0]}
                  alt={project.title}
                  className="w-full rounded-lg"
                />
              </div>
            )}
            <div className="md:w-1/2">
              <h1 className="text-3xl font-bold mb-4">{project.title}</h1>
              <p className="text-gray-600 mb-4">{project.short_description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technology_stack?.split(',').map((tech, idx) => (
                  <span key={idx} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
                    {tech.trim()}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">{project.difficulty_level}</span>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">{project.category}</span>
                <div className="flex items-center">
                  <span className="text-yellow-500 text-lg">★</span>
                  <span className="ml-1 text-lg">{project.rating?.toFixed(1) || 0}</span>
                  <span className="ml-1 text-gray-500">({project.total_ratings || 0} reviews)</span>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-primary-600 mb-6">
                ₹{project.price}
              </div>
              
              {hasPurchased ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  ✓ You have purchased this project
                </div>
              ) : (
                <button
                  onClick={handleBuyNow}
                  disabled={processingPayment}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {processingPayment ? 'Processing...' : 'Buy Now'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Description */}
            {project.full_description && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{project.full_description}</p>
              </div>
            )}

            {/* Features */}
            {project.features?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Features</h2>
                <ul className="space-y-2">
                  {project.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Screenshots */}
            {project.preview?.screenshot_urls?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Screenshots</h2>
                <div className="grid grid-cols-2 gap-4">
                  {project.preview.screenshot_urls.map((url, idx) => (
                    <img key={idx} src={url} alt={`Screenshot ${idx + 1}`} className="rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            {/* Demo Video */}
            {project.preview?.demo_video_url && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Demo Video</h2>
                <video controls className="w-full rounded-lg">
                  <source src={project.preview.demo_video_url} type="video/mp4" />
                </video>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              
              {/* Add Review Form */}
              {isAuthenticated && hasPurchased && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3">Write a Review</h3>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    <select
                      className="input"
                      value={reviewData.rating}
                      onChange={(e) => setReviewData({ ...reviewData, rating: Number(e.target.value) })}
                    >
                      <option value={5}>5 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={2}>2 Stars</option>
                      <option value={1}>1 Star</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Comment</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                      placeholder="Share your experience..."
                    />
                  </div>
                  <button type="submit" disabled={submittingReview} className="btn btn-primary">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
              
              {project.reviews?.length > 0 ? (
                <div className="space-y-4">
                  {project.reviews.map((review) => (
                    <div key={review._id} className="border-b pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.user_name}</span>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar - Purchased Content */}
          <div>
            {hasPurchased ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Your Project Files</h2>
                <div className="space-y-3">
                  <button onClick={() => handleDownload('source_code')} className="btn btn-outline w-full">
                    📁 Source Code
                  </button>
                  <button onClick={() => handleDownload('documentation')} className="btn btn-outline w-full">
                    📄 Documentation
                  </button>
                  <button onClick={() => handleDownload('project_report')} className="btn btn-outline w-full">
                    📊 Project Report
                  </button>
                  <button onClick={() => handleDownload('demo_video')} className="btn btn-outline w-full">
                    🎥 Demo Video
                  </button>
                  <button onClick={() => handleDownload('readme')} className="btn btn-outline w-full">
                    📖 Readme
                  </button>
                </div>
                {purchasedData && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Purchased on:</p>
                    <p className="font-medium">{new Date(purchasedData.purchase_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">What's Included</h2>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="text-gray-400 mr-2">🔒</span>
                    <span>Source Code</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-400 mr-2">🔒</span>
                    <span>Documentation</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-400 mr-2">🔒</span>
                    <span>Project Report</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-400 mr-2">🔒</span>
                    <span>Demo Video</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-400 mr-2">🔒</span>
                    <span>Readme / Installation Guide</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
