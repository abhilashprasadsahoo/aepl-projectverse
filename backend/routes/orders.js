const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const Project = require('../models/Project');
const ProjectFiles = require('../models/ProjectFiles');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   POST /api/orders/create
// @desc    Create Razorpay order for a project
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    const { projectId } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user already purchased this project
    const existingOrder = await Order.findOne({
      user_id: req.user.id,
      project_id: projectId,
      status: 'paid'
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this project'
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(project.price * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${projectId}_${req.user.id}_${Date.now()}`,
      notes: {
        projectId: projectId,
        userId: req.user.id
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create order in database
    const order = await Order.create({
      user_id: req.user.id,
      project_id: projectId,
      razorpay_order_id: razorpayOrder.id,
      amount: project.price,
      status: 'pending'
    });

    res.json({
      success: true,
      order: {
        id: order._id,
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/orders/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const signBody = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(signBody)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Update order status to failed
      await Order.findOneAndUpdate(
        { razorpay_order_id },
        { status: 'failed' }
      );

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find and update order
    const order = await Order.findOneAndUpdate(
      { razorpay_order_id },
      {
        status: 'paid',
        payment_id: razorpay_payment_id,
        razorpay_signature,
        purchase_date: new Date()
      },
      { new: true }
    ).populate('project_id', 'title');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        _id: order._id,
        project: order.project_id,
        purchase_date: order.purchase_date,
        amount: order.amount
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get user's purchased projects
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({
      user_id: req.user.id,
      status: 'paid'
    })
      .populate('project_id', 'title short_description price rating technology_stack')
      .sort('-purchase_date');

    const projects = orders.map(order => ({
      _id: order._id,
      project: order.project_id,
      purchase_date: order.purchase_date,
      amount: order.amount,
      payment_id: order.payment_id
    }));

    res.json({
      success: true,
      orders: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/orders/:projectId/download
// @desc    Get project download links (if purchased)
// @access  Private
router.get('/:projectId/download', protect, async (req, res) => {
  try {
    // Check if user purchased the project
    const order = await Order.findOne({
      user_id: req.user.id,
      project_id: req.params.projectId,
      status: 'paid'
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this project to download files'
      });
    }

    // Get project files
    const projectFiles = await ProjectFiles.findOne({
      project_id: req.params.projectId
    });

    if (!projectFiles) {
      return res.status(404).json({
        success: false,
        message: 'Project files not found'
      });
    }

    const project = await Project.findById(req.params.projectId);

    res.json({
      success: true,
      project: {
        _id: project._id,
        title: project.title
      },
      files: {
        source_code: projectFiles.source_code,
        documentation: projectFiles.documentation,
        project_report: projectFiles.project_report,
        demo_video: projectFiles.demo_video,
        readme: projectFiles.readme
      },
      downloadBaseUrl: '/api/orders/download-file'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/orders/download-file
// @desc    Download specific project file
// @access  Private (verified purchasers only)
router.get('/download-file', protect, async (req, res) => {
  try {
    const { projectId, fileType } = req.query;

    // Check if user purchased the project
    const order = await Order.findOne({
      user_id: req.user.id,
      project_id: projectId,
      status: 'paid'
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this project to download files'
      });
    }

    // Get project files
    const projectFiles = await ProjectFiles.findOne({ project_id: projectId });

    if (!projectFiles) {
      return res.status(404).json({
        success: false,
        message: 'Project files not found'
      });
    }

    // Get file path based on type
    let filePath;
    switch (fileType) {
      case 'source_code':
        filePath = projectFiles.source_code;
        break;
      case 'documentation':
        filePath = projectFiles.documentation;
        break;
      case 'project_report':
        filePath = projectFiles.project_report;
        break;
      case 'demo_video':
        filePath = projectFiles.demo_video;
        break;
      case 'readme':
        filePath = projectFiles.readme;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid file type'
        });
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not available'
      });
    }

    // Download file
    const fullPath = path.join(__dirname, '..', filePath);
    res.download(fullPath);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
