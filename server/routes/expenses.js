const express = require('express');
const { getExpenses, addExpense, getExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getExpenses)
  .post(addExpense);

router
  .route('/:id')
  .get(getExpense);

module.exports = router;
