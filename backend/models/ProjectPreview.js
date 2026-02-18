const mongoose = require('mongoose');

const projectPreviewSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  screenshot_urls: [{
    type: String
  }],
  demo_video_url: {
    type: String,
    default: ''
  },
  thumbnail_url: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProjectPreview', projectPreviewSchema);
