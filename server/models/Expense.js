const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true }, // e.g. Food, Hotel, Fuel, Shopping, Tickets
  location: { type: String },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  tags: [{ type: String }], // Simple array example
  billImage: { type: String }, // URL or Base64
  
  // Who actually paid the money and how much
  paidBy: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amountPaid: { type: Number, required: true }
  }],
  
  // Who the expense is split between and their share
  splitBetween: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
    shareAmount: { type: Number, required: true }
  }],
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for common queries
expenseSchema.index({ tripId: 1, date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ 'paidBy.memberId': 1 });

module.exports = mongoose.model('Expense', expenseSchema);
