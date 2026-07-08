const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const reservationService = require('../services/reservationService');
const mongoose = require('mongoose');

// Helper to check restaurant ownership
const checkRestaurantOwnership = async (restaurantId, userId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return false;
  return restaurant.ownerId.toString() === userId;
};

// @desc    Create a reservation (Book Table)
// @route   POST /api/reservations
// @access  Private (Customer & Admin)
exports.createReservation = async (req, res, next) => {
  try {
    const { restaurantId, date, startTime, endTime, guestCount, specialRequests } = req.body;

    // 1. Fetch restaurant and verify hours
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Verify booking is within open hours
    if (startTime < restaurant.openingHours.open || endTime > restaurant.openingHours.close) {
      return res.status(400).json({
        success: false,
        message: `Booking must be within restaurant open hours: ${restaurant.openingHours.open} - ${restaurant.openingHours.close}`
      });
    }

    // 2. Allocate table
    const table = await reservationService.findAvailableTable(
      restaurantId,
      date,
      startTime,
      endTime,
      guestCount
    );

    if (!table) {
      return res.status(409).json({
        success: false,
        message: 'No tables available for the selected time and guest capacity'
      });
    }

    // 3. Create reservation instance
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const reservation = new Reservation({
      customerId: req.user.id,
      restaurantId,
      tableId: table._id,
      date: bookingDate,
      startTime,
      endTime,
      guestCount,
      specialRequests: specialRequests || '',
      status: 'pending' // Defaults to pending, requires approval or auto-approves. We default to pending and admins approve.
    });

    // 4. Generate QR Code
    reservation.qrCode = await reservationService.generateQRCode(reservation);

    await reservation.save();

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully. Status: Pending approval.',
      data: reservation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reservation history for logged in customer
// @route   GET /api/reservations/my-bookings
// @access  Private
exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customerId: req.user.id })
      .populate('restaurantId', 'name location address photos')
      .populate('tableId', 'tableNumber capacity')
      .sort('-date -startTime');

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reservations for admin's restaurants (with filters)
// @route   GET /api/reservations/admin-bookings
// @access  Private (Admin only)
exports.getAdminReservations = async (req, res, next) => {
  try {
    // Find all restaurants owned by this admin
    const ownedRestaurants = await Restaurant.find({ ownerId: req.user.id });
    const restaurantIds = ownedRestaurants.map((r) => r._id);

    // Filter properties
    const filter = { restaurantId: { $in: restaurantIds } };

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.date) {
      const queryDate = new Date(req.query.date);
      queryDate.setHours(0, 0, 0, 0);
      filter.date = queryDate;
    }
    if (req.query.restaurantId) {
      // Must verify it's one of their restaurants
      if (restaurantIds.map(id => id.toString()).includes(req.query.restaurantId)) {
        filter.restaurantId = req.query.restaurantId;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view bookings for this restaurant'
        });
      }
    }

    const reservations = await Reservation.find(filter)
      .populate('restaurantId', 'name')
      .populate('tableId', 'tableNumber')
      .populate('customerId', 'name email phone')
      .sort('-date -startTime');

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a reservation (Edit booking)
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = async (req, res, next) => {
  try {
    let reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check ownership (only the booking customer or the restaurant owner can edit)
    const isCustomer = reservation.customerId.toString() === req.user.id;
    const isRestaurantOwner = await checkRestaurantOwnership(reservation.restaurantId, req.user.id);

    if (!isCustomer && !isRestaurantOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reservation'
      });
    }

    const { date, startTime, endTime, guestCount, specialRequests } = req.body;
    const bookingDate = date ? new Date(date) : reservation.date;
    if (date) {
      bookingDate.setHours(0, 0, 0, 0);
    }

    // Check if critical booking parameters are changing. If so, re-allocate table
    const timeChanged = (startTime && startTime !== reservation.startTime) || (endTime && endTime !== reservation.endTime);
    const dateChanged = date && bookingDate.getTime() !== new Date(reservation.date).getTime();
    const guestsChanged = guestCount && guestCount !== reservation.guestCount;

    if (timeChanged || dateChanged || guestsChanged) {
      // We must temporarily mock freeing the current table reservation to check availability correctly
      const tempStatus = reservation.status;
      reservation.status = 'cancelled'; // Mark cancelled temporarily in memory/DB
      await reservation.save();

      const newTable = await reservationService.findAvailableTable(
        reservation.restaurantId,
        bookingDate,
        startTime || reservation.startTime,
        endTime || reservation.endTime,
        guestCount || reservation.guestCount
      );

      if (!newTable) {
        // Revert status and return error
        reservation.status = tempStatus;
        await reservation.save();
        return res.status(409).json({
          success: false,
          message: 'No available tables found for the requested schedule'
        });
      }

      reservation.tableId = newTable._id;
      reservation.date = bookingDate;
      reservation.startTime = startTime || reservation.startTime;
      reservation.endTime = endTime || reservation.endTime;
      reservation.guestCount = guestCount || reservation.guestCount;
      reservation.status = 'pending'; // Reset to pending approval
    }

    if (specialRequests !== undefined) {
      reservation.specialRequests = specialRequests;
    }

    // Regenerate QR Code
    reservation.qrCode = await reservationService.generateQRCode(reservation);
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reservation updated successfully',
      data: reservation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update reservation status (Approve/Reject/Cancel)
// @route   PATCH /api/reservations/:id/status
// @access  Private
exports.updateReservationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Roles checks
    const isCustomer = reservation.customerId.toString() === req.user.id;
    const isRestaurantOwner = await checkRestaurantOwnership(reservation.restaurantId, req.user.id);

    if (status === 'cancelled') {
      // Both Customer and Admin can cancel
      if (!isCustomer && !isRestaurantOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this reservation'
        });
      }
    } else {
      // Approve/Reject is Admin-only
      if (!isRestaurantOwner) {
        return res.status(403).json({
          success: false,
          message: 'Only restaurant admins can approve or reject reservations'
        });
      }
    }

    reservation.status = status;
    await reservation.save();

    res.status(200).json({
      success: true,
      message: `Reservation status updated to ${status}`,
      data: reservation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a reservation
// @route   DELETE /api/reservations/:id
// @access  Private (Admin or booking owner)
exports.deleteReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const isCustomer = reservation.customerId.toString() === req.user.id;
    const isRestaurantOwner = await checkRestaurantOwnership(reservation.restaurantId, req.user.id);

    if (!isCustomer && !isRestaurantOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reservation'
      });
    }

    await reservation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard analytics for admin
// @route   GET /api/reservations/analytics
// @access  Private (Admin only)
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    // Find admin restaurants
    const ownedRestaurants = await Restaurant.find({ ownerId: req.user.id });
    const restaurantIds = ownedRestaurants.map((r) => r._id);

    if (restaurantIds.length === 0) {
      return res.status(200).json({
        success: true,
        analytics: {
          totalReservations: 0,
          todayReservations: 0,
          monthlyReservations: 0,
          revenue: 0,
          popularSlots: []
        }
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Total reservations count
    const totalReservations = await Reservation.countDocuments({
      restaurantId: { $in: restaurantIds }
    });

    // Today's reservations count
    const todayReservations = await Reservation.countDocuments({
      restaurantId: { $in: restaurantIds },
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    // Monthly reservations count
    const monthlyReservations = await Reservation.countDocuments({
      restaurantId: { $in: restaurantIds },
      date: { $gte: startOfMonth }
    });

    // Approved reservations for revenue calculation
    const approvedReservations = await Reservation.find({
      restaurantId: { $in: restaurantIds },
      status: 'approved'
    });

    // Revenue calculations ($25 per guest booked and approved)
    const totalRevenue = approvedReservations.reduce((sum, res) => sum + res.guestCount * 25, 0);

    // Popular time slots aggregation
    const popularSlotsRaw = await Reservation.aggregate([
      {
        $match: {
          restaurantId: { $in: restaurantIds }
        }
      },
      {
        $group: {
          _id: '$startTime',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const popularSlots = popularSlotsRaw.map((slot) => ({
      slot: slot._id,
      bookings: slot.count
    }));

    res.status(200).json({
      success: true,
      analytics: {
        totalReservations,
        todayReservations,
        monthlyReservations,
        revenue: totalRevenue,
        popularSlots
      }
    });
  } catch (err) {
    next(err);
  }
};
