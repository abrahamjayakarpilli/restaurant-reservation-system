const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: [true, 'Please add a start time'],
      match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format']
    },
    endTime: {
      type: String,
      required: [true, 'Please add an end time'],
      match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format']
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure a time slot is unique for a restaurant
TimeSlotSchema.index({ restaurantId: 1, startTime: 1, endTime: 1 }, { unique: true });

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
