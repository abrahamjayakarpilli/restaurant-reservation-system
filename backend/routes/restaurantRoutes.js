const express = require('express');
const {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadRestaurantPhotos
} = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { restaurantRules, validate } = require('../validators/requestValidators');

// Include other resource routers
const tableRouter = require('./tableRoutes');
const timeSlotRouter = require('./timeSlotRoutes');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:restaurantId/tables', tableRouter);
router.use('/:restaurantId/slots', timeSlotRouter);
router.use('/:restaurantId/reviews', reviewRouter);

router
  .route('/')
  .get(getRestaurants)
  .post(protect, authorize('admin'), restaurantRules, validate, createRestaurant);

router
  .route('/:id')
  .get(getRestaurant)
  .put(protect, authorize('admin'), restaurantRules, validate, updateRestaurant)
  .delete(protect, authorize('admin'), deleteRestaurant);

router
  .route('/:id/photos')
  .post(protect, authorize('admin'), upload.array('photos', 5), uploadRestaurantPhotos);

module.exports = router;
