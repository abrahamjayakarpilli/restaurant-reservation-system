const express = require('express');
const {
  createReservation,
  getMyReservations,
  getAdminReservations,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  getAdminAnalytics
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');
const { reservationRules, validate } = require('../validators/requestValidators');

const router = express.Router();

router.use(protect); // All reservation routes are protected

router
  .route('/')
  .post(reservationRules, validate, createReservation);

router.get('/my-bookings', getMyReservations);
router.get('/admin-bookings', authorize('admin'), getAdminReservations);
router.get('/analytics', authorize('admin'), getAdminAnalytics);

router
  .route('/:id')
  .put(reservationRules, validate, updateReservation)
  .delete(deleteReservation);

router.patch('/:id/status', updateReservationStatus);

module.exports = router;
