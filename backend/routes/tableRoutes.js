const express = require('express');
const {
  getTables,
  createTable,
  updateTable,
  deleteTable
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');
const { tableRules, validate } = require('../validators/requestValidators');

// Enable mergeParams to access parent parameters (like restaurantId)
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getTables)
  .post(protect, authorize('admin'), tableRules, validate, createTable);

router
  .route('/:id')
  .put(protect, authorize('admin'), tableRules, validate, updateTable)
  .delete(protect, authorize('admin'), deleteTable);

module.exports = router;
