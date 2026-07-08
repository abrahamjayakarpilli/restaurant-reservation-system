const { body, validationResult } = require('express-validator');

// Validation wrapper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Invalid role specify customer or admin')
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Restaurant rules
const restaurantRules = [
  body('name').trim().notEmpty().withMessage('Restaurant name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('cuisine')
    .custom((value) => {
      if (!value) return false;
      // Convert to array if string
      const cuisines = typeof value === 'string' ? value.split(',') : value;
      return Array.isArray(cuisines) && cuisines.length > 0;
    })
    .withMessage('At least one cuisine type is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('contactDetails.phone').trim().notEmpty().withMessage('Contact phone number is required'),
  body('contactDetails.email').trim().isEmail().withMessage('Contact email is required'),
  body('openingHours.open')
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Opening hour must be in HH:MM format'),
  body('openingHours.close')
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Closing hour must be in HH:MM format')
];

// Table rules
const tableRules = [
  body('tableNumber').trim().notEmpty().withMessage('Table number is required'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1 guest')
];

// Time Slot rules
const timeSlotRules = [
  body('startTime')
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

// Reservation rules
const reservationRules = [
  body('date')
    .isISO8601()
    .withMessage('Please specify a valid date (YYYY-MM-DD)')
    .custom((val) => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        throw new Error('Reservation date cannot be in the past');
      }
      return true;
    }),
  body('startTime')
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
    .custom((val, { req }) => {
      if (val <= req.body.startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('guestCount')
    .isInt({ min: 1 })
    .withMessage('Guest count must be at least 1')
];

// Review rules
const reviewRules = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Review comment is required')
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  changePasswordRules,
  restaurantRules,
  tableRules,
  timeSlotRules,
  reservationRules,
  reviewRules
};
