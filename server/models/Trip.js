const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  destination: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  currency: { type: String, default: 'USD' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String },
    joinedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
tripSchema.index({ createdBy: 1 });
tripSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Trip', tripSchema);
