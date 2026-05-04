const express = require('express');
const { getExpenses, addExpense, getExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getExpenses)
  .post(addExpense);

router
  .route('/:id')
  .get(getExpense)
  .delete(deleteExpense);

module.exports = router;
