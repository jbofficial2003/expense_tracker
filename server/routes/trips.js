const express = require('express');
const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  addMember,
  deleteTrip
} = require('../controllers/tripController');

const { protect } = require('../middleware/auth');

const expenseRouter = require('./expenses');

const router = express.Router();

router.use('/:tripId/expenses', expenseRouter);

router.use(protect);

router
  .route('/')
  .get(getTrips)
  .post(createTrip);

router
  .route('/:id')
  .get(getTrip)
  .put(updateTrip)
  .delete(deleteTrip);

router.post('/:id/members', addMember);

module.exports = router;
