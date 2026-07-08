const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    restaurantId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    tableId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Table',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Please select a reservation date'],
      index: true
    },
    timeSlotId: {
      type: mongoose.Schema.ObjectId,
      ref: 'TimeSlot',
      required: false // Optional if custom slots are allowed, but we link it if selected
    },
    startTime: {
      type: String,
      required: [true, 'Please add a start time (HH:MM)'],
      match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format']
    },
    endTime: {
      type: String,
      required: [true, 'Please add an end time (HH:MM)'],
      match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format']
    },
    guestCount: {
      type: Number,
      required: [true, 'Please specify the number of guests'],
      min: [1, 'At least 1 guest required']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    specialRequests: {
      type: String,
      default: ''
    },
    qrCode: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// We need a compound index to prevent double bookings on the same table on the same date and overlapping time.
// Note: While MongoDB compound indexes help, overlap verification is typically done in the service layer using queries.
// We will create indexes on { tableId: 1, date: 1 } for speed.
ReservationSchema.index({ tableId: 1, date: 1 });

module.exports = mongoose.model('Reservation', ReservationSchema);
