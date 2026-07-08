const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    tableNumber: {
      type: String,
      required: [true, 'Please add a table number or label']
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify table capacity (number of seats)'],
      min: [1, 'Capacity must be at least 1 seat'],
      index: true
    },
    status: {
      type: String,
      enum: ['available', 'maintenance'],
      default: 'available'
    }
  },
  {
    timestamps: true
  }
);

// Ensure tableNumber is unique within a single restaurant
TableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', TableSchema);
