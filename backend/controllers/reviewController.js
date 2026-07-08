const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

// @desc    Get reviews for a restaurant
// @route   GET /api/restaurants/:restaurantId/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ restaurantId: req.params.restaurantId })
      .populate('customerId', 'name profilePicture')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create review
// @route   POST /api/restaurants/:restaurantId/reviews
// @access  Private (Customer only)
exports.createReview = async (req, res, next) => {
  try {
    req.body.restaurantId = req.params.restaurantId;
    req.body.customerId = req.user.id;

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if already reviewed
    const alreadyReviewed = await Review.findOne({
      customerId: req.user.id,
      restaurantId: req.params.restaurantId
    });

    if (alreadyReviewed) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this restaurant'
      });
    }

    const review = await Review.create(req.body);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Explicitly call static rating method since findByIdAndUpdate doesn't trigger post save hooks on models directly
    await Review.getAverageRating(review.restaurantId);

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.customerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    const restaurantId = review.restaurantId;
    await review.deleteOne();

    // Re-calculate ratings after deletion
    await Review.getAverageRating(restaurantId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
