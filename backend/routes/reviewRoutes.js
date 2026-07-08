const express = require('express');
const {
  getReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { reviewRules, validate } = require('../validators/requestValidators');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getReviews)
  .post(protect, authorize('customer'), reviewRules, validate, createReview);

router
  .route('/:id')
  .put(protect, reviewRules, validate, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
