const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ProjectPreview = require('../models/ProjectPreview');
const ProjectFiles = require('../models/ProjectFiles');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// @route   GET /api/projects
// @desc    Get all active projects (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, difficulty, search, sort = '-createdAt' } = req.query;

    // Build query
    let query = { status: 'active' };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty_level = difficulty;
    if (search) {
      query.$text = { $search: search };
    }

    const projects = await Project.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Project.countDocuments(query);

    // Get preview data for each project
    const projectsWithPreview = await Promise.all(
      projects.map(async (project) => {
        const preview = await ProjectPreview.findOne({ project_id: project._id });
        return {
          _id: project._id,
          title: project.title,
          short_description: project.short_description,
          technology_stack: project.technology_stack,
          difficulty_level: project.difficulty_level,
          price: project.price,
          rating: project.rating,
          total_ratings: project.total_ratings,
          category: project.category,
          is_featured: project.is_featured,
          screenshot_urls: preview?.screenshot_urls || [],
          thumbnail_url: preview?.thumbnail_url || ''
        };
      })
    );

    res.json({
      success: true,
      projects: projectsWithPreview,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProjects: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/projects/featured
// @desc    Get featured projects
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'active', is_featured: true })
      .sort('-createdAt')
      .limit(6);

    const projectsWithPreview = await Promise.all(
      projects.map(async (project) => {
        const preview = await ProjectPreview.findOne({ project_id: project._id });
        return {
          _id: project._id,
          title: project.title,
          short_description: project.short_description,
          technology_stack: project.technology_stack,
          difficulty_level: project.difficulty_level,
          price: project.price,
          rating: project.rating,
          total_ratings: project.total_ratings,
          thumbnail_url: preview?.thumbnail_url || ''
        };
      })
    );

    res.json({
      success: true,
      projects: projectsWithPreview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project details (preview)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const preview = await ProjectPreview.findOne({ project_id: project._id });
    
    // Get reviews
    const reviews = await Review.find({ project_id: project._id, is_approved: true })
      .populate('user_id', 'name')
      .sort('-createdAt')
      .limit(10);

    // Check if user has purchased the project
    let hasPurchased = false;
    let purchased = null;
    
    if (req.headers.authorization) {
      try {
        const { protect } = require('../middleware/auth');
        // We'll handle this in a better way
      } catch (e) {
        // Ignore auth errors for preview
      }
    }

    res.json({
      success: true,
      project: {
        _id: project._id,
        title: project.title,
        short_description: project.short_description,
        full_description: project.full_description,
        technology_stack: project.technology_stack,
        difficulty_level: project.difficulty_level,
        price: project.price,
        rating: project.rating,
        total_ratings: project.total_ratings,
        category: project.category,
        features: project.features,
        requirements: project.requirements,
        is_featured: project.is_featured,
        createdAt: project.createdAt,
        preview: preview ? {
          screenshot_urls: preview.screenshot_urls,
          demo_video_url: preview.demo_video_url,
          thumbnail_url: preview.thumbnail_url
        } : null,
        reviews: reviews.map(r => ({
          _id: r._id,
          user_name: r.user_id?.name || 'Anonymous',
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt
        }))
      },
      hasPurchased
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/projects/:id/check-purchase
// @desc    Check if user has purchased the project
// @access  Private
router.get('/:id/check-purchase', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      user_id: req.user.id,
      project_id: req.params.id,
      status: 'paid'
    });

    res.json({
      success: true,
      hasPurchased: !!order,
      order: order ? {
        _id: order._id,
        purchase_date: order.purchase_date,
        amount: order.amount
      } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
