const Trip = require('../models/Trip');
const Expense = require('../models/Expense');

// @desc    Get all trips for a user
// @route   GET /api/trips
// @access  Private
exports.getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      $or: [
        { createdBy: req.user.id },
        { members: { $elemMatch: { userId: req.user.id } } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
exports.getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    // Optional: Check if user is part of the trip
    const isMember = trip.members.some(m => m.userId && m.userId.toString() === req.user.id) || trip.createdBy.toString() === req.user.id;
    if (!isMember) {
      return res.status(401).json({ success: false, error: 'Not authorized to view this trip' });
    }

    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new trip
// @route   POST /api/trips
// @access  Private
exports.createTrip = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Automatically add the creator as a member
    if (!req.body.members) {
      req.body.members = [];
    }
    
    const creatorExists = req.body.members.find(m => m.userId === req.user.id);
    if (!creatorExists) {
      req.body.members.unshift({
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email
      });
    }

    const trip = await Trip.create(req.body);

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private
exports.updateTrip = async (req, res) => {
  try {
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to update this trip' });
    }

    trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add member to trip
// @route   POST /api/trips/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to modify this trip' });
    }

    const { name, email, userId } = req.body;
    
    trip.members.push({ name, email, userId });
    await trip.save();

    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this trip' });
    }

    // Cascade delete associated expenses
    await Expense.deleteMany({ tripId: req.params.id });

    await trip.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
