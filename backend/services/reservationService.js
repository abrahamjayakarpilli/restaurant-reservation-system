const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const QRCode = require('qrcode');

/**
 * Finds the best available table for the given date, time range, and guest count.
 * Allocates the table with the smallest capacity that is >= guestCount to minimize seat waste.
 */
const findAvailableTable = async (restaurantId, date, startTime, endTime, guestCount) => {
  // 1. Find all active tables at the restaurant that can accommodate the guests
  const suitableTables = await Table.find({
    restaurantId,
    status: 'available',
    capacity: { $gte: guestCount }
  }).sort({ capacity: 1 }); // Sort by capacity ascending to get the smallest matching table first

  if (suitableTables.length === 0) {
    return null; // No tables have enough capacity
  }

  // Parse date to start of day for query consistency
  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);

  // 2. Loop through suitable tables and check for overlapping reservations
  for (const table of suitableTables) {
    const overlapping = await Reservation.findOne({
      tableId: table._id,
      date: bookingDate,
      status: { $in: ['pending', 'approved'] },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });

    // If no overlapping reservation is found, this table is available!
    if (!overlapping) {
      return table;
    }
  }

  return null; // All suitable tables are booked
};

/**
 * Generates a QR Code containing reservation details.
 */
const generateQRCode = async (reservation) => {
  try {
    const qrData = JSON.stringify({
      reservationId: reservation._id,
      customerId: reservation.customerId,
      restaurantId: reservation.restaurantId,
      date: reservation.date,
      time: `${reservation.startTime} - ${reservation.endTime}`,
      guests: reservation.guestCount
    });

    const qrCodeImage = await QRCode.toDataURL(qrData);
    return qrCodeImage;
  } catch (err) {
    console.error(`QR Code generation failed: ${err.message}`);
    return '';
  }
};

module.exports = {
  findAvailableTable,
  generateQRCode
};
