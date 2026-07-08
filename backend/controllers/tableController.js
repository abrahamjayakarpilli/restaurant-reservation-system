const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');

// Helper to check restaurant ownership
const checkRestaurantOwnership = async (restaurantId, userId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return false;
  return restaurant.ownerId.toString() === userId;
};

// @desc    Get all tables for a restaurant
// @route   GET /api/restaurants/:restaurantId/tables
// @access  Public
exports.getTables = async (req, res, next) => {
  try {
    const tables = await Table.find({ restaurantId: req.params.restaurantId });
    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create table
// @route   POST /api/restaurants/:restaurantId/tables
// @access  Private (Admin only)
exports.createTable = async (req, res, next) => {
  try {
    const isOwner = await checkRestaurantOwnership(req.params.restaurantId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage tables for this restaurant'
      });
    }

    req.body.restaurantId = req.params.restaurantId;

    // Check if tableNumber already exists at this restaurant
    const existingTable = await Table.findOne({
      restaurantId: req.params.restaurantId,
      tableNumber: req.body.tableNumber
    });
    if (existingTable) {
      return res.status(409).json({
        success: false,
        message: `Table number ${req.body.tableNumber} already exists at this restaurant`
      });
    }

    const table = await Table.create(req.body);

    res.status(201).json({
      success: true,
      data: table
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update table details
// @route   PUT /api/tables/:id
// @access  Private (Admin only)
exports.updateTable = async (req, res, next) => {
  try {
    let table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table not found with id of ${req.params.id}`
      });
    }

    const isOwner = await checkRestaurantOwnership(table.restaurantId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this table'
      });
    }

    // Check for unique tableNumber if it's changing
    if (req.body.tableNumber && req.body.tableNumber !== table.tableNumber) {
      const existingTable = await Table.findOne({
        restaurantId: table.restaurantId,
        tableNumber: req.body.tableNumber
      });
      if (existingTable) {
        return res.status(409).json({
          success: false,
          message: `Table number ${req.body.tableNumber} already exists`
        });
      }
    }

    table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Admin only)
exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table not found with id of ${req.params.id}`
      });
    }

    const isOwner = await checkRestaurantOwnership(table.restaurantId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this table'
      });
    }

    await table.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
