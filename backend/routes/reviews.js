const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Project = require('../models/Project');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Add a review to a project
// @access  Private (must have purchased the project)
router.post('/', protect, async (req, res) => {
  try {
    const { projectId, rating, comment } = req.body;

    // Check if user purchased the project
    const order = await Order.findOne({
      user_id: req.user.id,
      project_id: projectId,
      status: 'paid'
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase the project before reviewing it'
      });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user_id: req.user.id,
      project_id: projectId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this project'
      });
    }

    // Create review
    const review = await Review.create({
      user_id: req.user.id,
      project_id: projectId,
      rating,
      comment
    });

    // Update project rating
    const reviews = await Review.find({ project_id: projectId, is_approved: true });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    await Project.findByIdAndUpdate(projectId, {
      rating: avgRating,
      total_ratings: reviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reviews/project/:projectId
// @desc    Get reviews for a project
// @access  Public
router.get('/project/:projectId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ 
      project_id: req.params.projectId,
      is_approved: true 
    })
      .populate('user_id', 'name avatar')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({ 
      project_id: req.params.projectId,
      is_approved: true 
    });

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalReviews: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update own review
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Find review
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    // Update project rating
    const reviews = await Review.find({ 
      project_id: review.project_id,
      is_approved: true 
    });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    await Project.findByIdAndUpdate(review.project_id, {
      rating: avgRating,
      total_ratings: reviews.length
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete own review
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Find review
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    const projectId = review.project_id;
    await review.deleteOne();

    // Update project rating
    const reviews = await Review.find({ 
      project_id: projectId,
      is_approved: true 
    });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      await Project.findByIdAndUpdate(projectId, {
        rating: avgRating,
        total_ratings: reviews.length
      });
    } else {
      await Project.findByIdAndUpdate(projectId, {
        rating: 0,
        total_ratings: 0
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
