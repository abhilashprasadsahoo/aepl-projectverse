const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Project = require('../models/Project');
const ProjectPreview = require('../models/ProjectPreview');
const ProjectFiles = require('../models/ProjectFiles');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { protect, adminOnly } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/projects';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Apply auth middleware to all admin routes
router.use(protect, adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'buyer' });
    const totalProjects = await Project.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentOrders = await Order.find({ status: 'paid' })
      .populate('user_id', 'name email')
      .populate('project_id', 'title')
      .sort('-purchase_date')
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProjects,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    
    let query = { role: 'buyer' };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/block
// @desc    Block or unblock a user
// @access  Admin
router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block an admin'
      });
    }

    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();

    res.json({
      success: true,
      message: `User ${user.status === 'active' ? 'unblocked' : 'blocked'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/projects
// @desc    Create a new project
// @access  Admin
router.post('/projects', async (req, res) => {
  try {
    const project = await Project.create(req.body);

    // Create empty preview and files
    await ProjectPreview.create({ project_id: project._id });
    await ProjectFiles.create({ project_id: project._id });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/projects/:id
// @desc    Update a project
// @access  Admin
router.put('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/projects/:id
// @desc    Delete a project
// @access  Admin
router.delete('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete related data
    await ProjectPreview.deleteMany({ project_id: req.params.id });
    await ProjectFiles.deleteMany({ project_id: req.params.id });
    await Order.deleteMany({ project_id: req.params.id });
    await Review.deleteMany({ project_id: req.params.id });

    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/projects/:id/feature
// @desc    Feature or unfeature a project
// @access  Admin
router.put('/projects/:id/feature', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.is_featured = !project.is_featured;
    await project.save();

    res.json({
      success: true,
      message: `Project ${project.is_featured ? 'featured' : 'unfeatured'} successfully`,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/projects/:id/preview
// @desc    Update project preview (screenshots, demo video)
// @access  Admin
router.post('/projects/:id/preview', upload.fields([
  { name: 'screenshots', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'demo_video', maxCount: 1 }
]), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const previewData = {};

    if (req.files['screenshots']) {
      previewData.screenshot_urls = req.files['screenshots'].map(f => `/uploads/projects/${f.filename}`);
    }

    if (req.files['thumbnail']) {
      previewData.thumbnail_url = `/uploads/projects/${req.files['thumbnail'][0].filename}`;
    }

    if (req.files['demo_video']) {
      previewData.demo_video_url = `/uploads/projects/${req.files['demo_video'][0].filename}`;
    }

    // If there's also a demo_video_url in body
    if (req.body.demo_video_url) {
      previewData.demo_video_url = req.body.demo_video_url;
    }

    const preview = await ProjectPreview.findOneAndUpdate(
      { project_id: req.params.id },
      previewData,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Project preview updated successfully',
      preview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/projects/:id/files
// @desc    Upload project files
// @access  Admin
router.post('/projects/:id/files', upload.fields([
  { name: 'source_code', maxCount: 1 },
  { name: 'documentation', maxCount: 1 },
  { name: 'project_report', maxCount: 1 },
  { name: 'demo_video', maxCount: 1 },
  { name: 'readme', maxCount: 1 }
]), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const filesData = {};

    if (req.files['source_code']) {
      filesData.source_code = `/uploads/projects/${req.files['source_code'][0].filename}`;
    }
    if (req.files['documentation']) {
      filesData.documentation = `/uploads/projects/${req.files['documentation'][0].filename}`;
    }
    if (req.files['project_report']) {
      filesData.project_report = `/uploads/projects/${req.files['project_report'][0].filename}`;
    }
    if (req.files['demo_video']) {
      filesData.demo_video = `/uploads/projects/${req.files['demo_video'][0].filename}`;
    }
    if (req.files['readme']) {
      filesData.readme = `/uploads/projects/${req.files['readme'][0].filename}`;
    }

    const files = await ProjectFiles.findOneAndUpdate(
      { project_id: req.params.id },
      filesData,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Project files uploaded successfully',
      files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/transactions
// @desc    Get all transactions
// @access  Admin
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    let query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.purchase_date = {};
      if (startDate) query.purchase_date.$gte = new Date(startDate);
      if (endDate) query.purchase_date.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('user_id', 'name email')
      .populate('project_id', 'title price')
      .sort('-purchase_date')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    const totalRevenue = await Order.aggregate([
      { $match: { ...query, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      transactions: orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTransactions: count,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete a review
// @access  Admin
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const projectId = review.project_id;
    await review.deleteOne();

    // Update project rating
    const reviews = await Review.find({ project_id: projectId, is_approved: true });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      await Project.findByIdAndUpdate(projectId, {
        rating: avgRating,
        total_ratings: reviews.length
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
