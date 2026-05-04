const express = require('express');
const { getTripBalances, getCategorySummary, getMyPayments } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/my-payments', getMyPayments);
router.get('/trip/:tripId/balances', getTripBalances);
router.get('/trip/:tripId/categories', getCategorySummary);

module.exports = router;
