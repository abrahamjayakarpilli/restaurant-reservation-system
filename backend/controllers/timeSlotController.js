const TimeSlot = require('../models/TimeSlot');
const Restaurant = require('../models/Restaurant');

// Helper to check restaurant ownership
const checkRestaurantOwnership = async (restaurantId, userId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return false;
  return restaurant.ownerId.toString() === userId;
};

// @desc    Get all time slots for a restaurant
// @route   GET /api/restaurants/:restaurantId/slots
// @access  Public
exports.getTimeSlots = async (req, res, next) => {
  try {
    const slots = await TimeSlot.find({ restaurantId: req.params.restaurantId }).sort({ startTime: 1 });
    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create time slot
// @route   POST /api/restaurants/:restaurantId/slots
// @access  Private (Admin only)
exports.createTimeSlot = async (req, res, next) => {
  try {
    const isOwner = await checkRestaurantOwnership(req.params.restaurantId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage slots for this restaurant'
      });
    }

    req.body.restaurantId = req.params.restaurantId;

    // Check if slot already exists
    const existingSlot = await TimeSlot.findOne({
      restaurantId: req.params.restaurantId,
      startTime: req.body.startTime,
      endTime: req.body.endTime
    });

    if (existingSlot) {
      return res.status(409).json({
        success: false,
        message: `Time slot ${req.body.startTime}-${req.body.endTime} already exists`
      });
    }

    const slot = await TimeSlot.create(req.body);

    res.status(201).json({
      success: true,
      data: slot
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update time slot
// @route   PUT /api/slots/:id
// @access  Private (Admin only)
exports.updateTimeSlot = async (req, res, next) => {
  try {
    let slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: `Time slot not found with id of ${req.params.id}`
      });
    }

    const isOwner = await checkRestaurantOwnership(slot.restaurantId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this time slot'
      });
    }

    // Check for unique slot timing if changing
    if ((req.body.startTime && req.body.startTime !== slot.startTime) || (req.body.endTime && req.body.endTime !== slot.endTime)) {
      const start = req.body.startTime || slot.startTime;
      const end = req.body.endTime || slot.endTime;

      const existingSlot = await TimeSlot.findOne({
        restaurantId: slot.restaurantId,
        startTime: start,
        endTime: end
      });

      if (existingSlot && existingSlot.id !== slot.id) {
        return res.status(409).json({
          success: false,
          message: `Time slot ${start}-${end} already exists`
        });
      }
    }

    slot = await TimeSlot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: slot
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete time slot
// @route   DELETE /api/slots/:id
// @access  Private (Admin only)
exports.deleteTimeSlot = async (req, res, next) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: `Time slot not found with id of ${req.params.id}`
      });
    }

    const isOwner = await checkRestaurantOwnership(slot.restaurantId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this time slot'
      });
    }

    await slot.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Time slot deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
