const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  razorpay_order_id: {
    type: String,
    required: true
  },
  payment_id: {
    type: String,
    default: ''
  },
  razorpay_signature: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    default: ''
  },
  purchase_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate orders for same project by same user
orderSchema.index({ user_id: 1, project_id: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);
