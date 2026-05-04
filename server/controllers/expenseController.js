const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

// @desc    Get expenses for a trip
// @route   GET /api/trips/:tripId/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ tripId: req.params.tripId }).sort({ date: -1 });
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add expense
// @route   POST /api/trips/:tripId/expenses
// @access  Private
exports.addExpense = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    req.body.tripId = req.params.tripId;
    req.body.createdBy = req.user.id;

    // We'll try to use a transaction. If it fails due to replica set requirement, we fall back.
    let expense;
    try {
      session.startTransaction();
      
      // Verify trip exists
      const trip = await Trip.findById(req.params.tripId).session(session);
      if (!trip) {
        throw new Error('Trip not found');
      }

      expense = await Expense.create([req.body], { session });
      
      await session.commitTransaction();
    } catch (txError) {
      // If transaction is not supported (standalone MongoDB)
      await session.abortTransaction();
      console.warn('Transaction failed, falling back to non-transactional mode:', txError.message);
      
      const trip = await Trip.findById(req.params.tripId);
      if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });
      
      expense = await Expense.create(req.body);
    } finally {
      session.endSession();
    }

    res.status(201).json({ success: true, data: Array.isArray(expense) ? expense[0] : expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
