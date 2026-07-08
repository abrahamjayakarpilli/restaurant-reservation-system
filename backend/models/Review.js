const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    restaurantId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating between 1 and 5'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Please add a review comment'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent user from submitting more than one review per restaurant
ReviewSchema.index({ customerId: 1, restaurantId: 1 }, { unique: true });

// Static method to get avg rating and save
ReviewSchema.statics.getAverageRating = async function (restaurantId) {
  const obj = await this.aggregate([
    {
      $match: { restaurantId: restaurantId }
    },
    {
      $group: {
        _id: '$restaurantId',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    if (obj.length > 0) {
      await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
        rating: Math.round(obj[0].averageRating * 10) / 10,
        numReviews: obj[0].numReviews
      });
    } else {
      await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
        rating: 0,
        numReviews: 0
      });
    }
  } catch (err) {
    console.error(`Error updating average rating: ${err.message}`);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.restaurantId);
});

// Call getAverageRating after delete/remove
// Note: In mongoose 8, deleteOne is triggered on document delete. For query middleware:
ReviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.restaurantId);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
