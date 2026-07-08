const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a restaurant name'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    cuisine: {
      type: [String],
      required: [true, 'Please specify cuisine types'],
      index: true
    },
    location: {
      type: String,
      required: [true, 'Please add a location (e.g., city, neighborhood)'],
      trim: true,
      index: true
    },
    address: {
      type: String,
      required: [true, 'Please add a physical address']
    },
    contactDetails: {
      phone: {
        type: String,
        required: [true, 'Please add a contact phone number']
      },
      email: {
        type: String,
        required: [true, 'Please add a contact email'],
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email'
        ]
      }
    },
    openingHours: {
      open: {
        type: String,
        required: [true, 'Please add opening time (HH:MM)'],
        match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format']
      },
      close: {
        type: String,
        required: [true, 'Please add closing time (HH:MM)'],
        match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format']
      }
    },
    photos: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    numReviews: {
      type: Number,
      default: 0
    },
    ownerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
RestaurantSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
