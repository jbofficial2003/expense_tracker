const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

// @desc    Get member balances for a trip
// @route   GET /api/reports/trip/:tripId/balances
// @access  Private
exports.getTripBalances = async (req, res) => {
  try {
    const tripId = new mongoose.Types.ObjectId(req.params.tripId);
    
    // Calculate total paid by each member
    const paidAgg = await Expense.aggregate([
      { $match: { tripId } },
      { $unwind: '$paidBy' },
      { $group: { _id: '$paidBy.memberId', totalPaid: { $sum: '$paidBy.amountPaid' } } }
    ]);

    // Calculate total share of each member
    const shareAgg = await Expense.aggregate([
      { $match: { tripId } },
      { $unwind: '$splitBetween' },
      { $group: { _id: '$splitBetween.memberId', totalShare: { $sum: '$splitBetween.shareAmount' } } }
    ]);

    // Combine results (could also be done with a single complex pipeline using $facet)
    const balances = {};
    
    paidAgg.forEach(p => {
      balances[p._id] = { totalPaid: p.totalPaid, totalShare: 0, balance: p.totalPaid };
    });

    shareAgg.forEach(s => {
      if (!balances[s._id]) {
        balances[s._id] = { totalPaid: 0, totalShare: 0, balance: 0 };
      }
      balances[s._id].totalShare = s.totalShare;
      balances[s._id].balance = balances[s._id].totalPaid - s.totalShare;
    });

    res.status(200).json({ success: true, data: Object.entries(balances).map(([memberId, data]) => ({ memberId, ...data })) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get category summary for a trip
// @route   GET /api/reports/trip/:tripId/categories
// @access  Private
exports.getCategorySummary = async (req, res) => {
  try {
    const tripId = new mongoose.Types.ObjectId(req.params.tripId);

    const summary = await Expense.aggregate([
      { $match: { tripId } },
      { $group: { _id: '$category', totalAmount: { $sum: '$amount' } } },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current user's payment history across all trips
// @route   GET /api/reports/my-payments
// @access  Private
exports.getMyPayments = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const payments = await Expense.aggregate([
      // Match expenses where the user is in the paidBy array
      { $match: { 'paidBy.memberId': userId } },
      // Unwind to evaluate each payer separately
      { $unwind: '$paidBy' },
      // Keep only this user's payment objects
      { $match: { 'paidBy.memberId': userId } },
      // Lookup the trip to get destination/name context ("where")
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'tripInfo'
        }
      },
      { $unwind: '$tripInfo' },
      // Project the final clean structure
      {
        $project: {
          _id: 1,
          tripId: 1,
          title: 1,
          category: 1,
          date: 1,
          amountPaid: '$paidBy.amountPaid',
          totalExpenseAmount: '$amount',
          tripName: '$tripInfo.name',
          destination: '$tripInfo.destination',
          currency: '$tripInfo.currency'
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
