const express = require('express');
const {
  getTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot
} = require('../controllers/timeSlotController');
const { protect, authorize } = require('../middleware/auth');
const { timeSlotRules, validate } = require('../validators/requestValidators');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getTimeSlots)
  .post(protect, authorize('admin'), timeSlotRules, validate, createTimeSlot);

router
  .route('/:id')
  .put(protect, authorize('admin'), timeSlotRules, validate, updateTimeSlot)
  .delete(protect, authorize('admin'), deleteTimeSlot);

module.exports = router;
