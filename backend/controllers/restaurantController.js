const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const TimeSlot = require('../models/TimeSlot');
const path = require('path');
const fs = require('fs');

// @desc    Get all restaurants (with filters, search, sorting, pagination)
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from matching
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

    // Parsing query JSON
    let queryObj = JSON.parse(queryStr);

    // Support search query parameter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      queryObj = {
        ...queryObj,
        $or: [
          { name: searchRegex },
          { location: searchRegex },
          { cuisine: searchRegex }
        ]
      };
    }

    // Support location filter specifically (case insensitive matching)
    if (req.query.location && !req.query.search) {
      queryObj.location = new RegExp(req.query.location, 'i');
    }

    // Support cuisine filter (match any of the cuisines in the array)
    if (req.query.cuisine && !req.query.search) {
      const cuisines = req.query.cuisine.split(',');
      queryObj.cuisine = { $in: cuisines.map((c) => new RegExp(c.trim(), 'i')) };
    }

    // Support minimum rating filter
    if (req.query.rating) {
      queryObj.rating = { $gte: parseFloat(req.query.rating) };
    }

    // Init query
    query = Restaurant.find(queryObj);

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); // Default sort by newest
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Restaurant.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const restaurants = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: restaurants.length,
      pagination,
      total,
      data: restaurants
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single restaurant details
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `Restaurant not found with id of ${req.params.id}`
      });
    }

    // Populate tables and slots for convenience
    const tables = await Table.find({ restaurantId: restaurant._id });
    const slots = await TimeSlot.find({ restaurantId: restaurant._id });

    res.status(200).json({
      success: true,
      data: {
        restaurant,
        tables,
        slots
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new restaurant
// @route   POST /api/restaurants
// @access  Private (Admin only)
exports.createRestaurant = async (req, res, next) => {
  try {
    // Add ownerId to req.body
    req.body.ownerId = req.user.id;

    // Handle cuisine if it's sent as string comma-separated
    if (req.body.cuisine && typeof req.body.cuisine === 'string') {
      req.body.cuisine = req.body.cuisine.split(',').map((c) => c.trim());
    }

    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update restaurant details
// @route   PUT /api/restaurants/:id
// @access  Private (Admin only)
exports.updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `Restaurant not found with id of ${req.params.id}`
      });
    }

    // Check ownership
    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    // Handle cuisine parsing
    if (req.body.cuisine && typeof req.body.cuisine === 'string') {
      req.body.cuisine = req.body.cuisine.split(',').map((c) => c.trim());
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (Admin only)
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `Restaurant not found with id of ${req.params.id}`
      });
    }

    // Check ownership
    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this restaurant'
      });
    }

    // Delete associated tables, slots, etc.
    await Table.deleteMany({ restaurantId: restaurant._id });
    await TimeSlot.deleteMany({ restaurantId: restaurant._id });
    await restaurant.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload photos for restaurant
// @route   POST /api/restaurants/:id/photos
// @access  Private (Admin only)
exports.uploadRestaurantPhotos = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `Restaurant not found with id of ${req.params.id}`
      });
    }

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this restaurant'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload image files'
      });
    }

    const photoPaths = req.files.map((file) => `uploads/${file.filename}`);
    
    // Add new photos to existing photos
    restaurant.photos = [...restaurant.photos, ...photoPaths];
    await restaurant.save();

    res.status(200).json({
      success: true,
      photos: restaurant.photos
    });
  } catch (err) {
    next(err);
  }
};
