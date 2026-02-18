const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  short_description: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  full_description: {
    type: String,
    required: [true, 'Full description is required']
  },
  technology_stack: [{
    type: String,
    trim: true
  }],
  difficulty_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  total_ratings: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['web', 'mobile', 'desktop', 'ai', 'data-science', 'other']
  },
  features: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  is_featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for text search
projectSchema.index({ title: 'text', short_description: 'text' });

module.exports = mongoose.model('Project', projectSchema);
