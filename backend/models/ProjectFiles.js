const mongoose = require('mongoose');

const projectFilesSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  source_code: {
    type: String,
    default: ''
  },
  documentation: {
    type: String,
    default: ''
  },
  project_report: {
    type: String,
    default: ''
  },
  demo_video: {
    type: String,
    default: ''
  },
  readme: {
    type: String,
    default: ''
  },
  additional_files: [{
    name: String,
    path: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ProjectFiles', projectFilesSchema);
