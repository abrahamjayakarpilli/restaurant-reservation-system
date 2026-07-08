const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const TimeSlot = require('../models/TimeSlot');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');

dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant-reservation');

const cuisinesList = [
  ['Italian', 'Pasta', 'Pizza'],
  ['Japanese', 'Sushi', 'Ramen'],
  ['Mexican', 'Tacos', 'Burritos'],
  ['Indian', 'Curry', 'Biryani'],
  ['French', 'Fine Dining', 'Bakery'],
  ['American', 'Burgers', 'Steak'],
  ['Chinese', 'Dim Sum', 'Noodles'],
  ['Thai', 'Pad Thai', 'Curry'],
  ['Mediterranean', 'Greek', 'Gyros'],
  ['Spanish', 'Tapas', 'Paella']
];

const locations = [
  'Downtown Manhattan, NY',
  'Beverly Hills, Los Angeles, CA',
  'Loop Chicago, IL',
  'Union Square, San Francisco, CA',
  'Back Bay, Boston, MA',
  'South Beach, Miami, FL',
  'Capitol Hill, Seattle, WA',
  'Rittenhouse Square, Philadelphia, PA',
  'Pearl District, Portland, OR',
  'Deep Ellum, Dallas, TX'
];

const descriptions = [
  'A modern culinary experience featuring authentic flavors crafted by award-winning chefs in a vibrant, sophisticated atmosphere.',
  'An elegant bistro offering exquisite dishes, curated wine pairings, and a charming patio perfect for romantic dinners or group gatherings.',
  'A lively, family-friendly eatery known for fresh local ingredients, artisanal recipes, and exceptional service in a cozy rustic space.',
  'A high-end gastronomic journey showcasing seasonal specialties, innovative presentation, and a curated selection of signature cocktails.',
  'Experience rich culinary traditions with our hand-stretched pizzas, homemade pastas, and delectable desserts made from scratch daily.'
];

const reviewerComments = [
  'Absolutely fantastic meal! The service was impeccable, and every course exceeded our expectations. Highly recommended!',
  'Great atmosphere and wonderful staff. The food was delicious, though the wait time was slightly longer than expected.',
  'A hidden gem! Beautiful presentation, rich flavors, and reasonable pricing. We will definitely be back soon.',
  'Nice decor and friendly service. The main course was average, but the appetizers and desserts were absolutely stellar.',
  'The perfect spot for a special occasion. Outstanding wine list, cozy seating, and top-tier chef specialties.'
];

const seedData = async () => {
  try {
    // 1. Clear Database
    console.log('Clearing database...');
    await User.deleteMany();
    await Restaurant.deleteMany();
    await Table.deleteMany();
    await TimeSlot.deleteMany();
    await Reservation.deleteMany();
    await Review.deleteMany();
    console.log('Database cleared.');

    // 2. Create Users
    console.log('Seeding users...');
    const users = [];

    // Create 1 Default Admin
    const defaultAdmin = await User.create({
      name: 'System Admin',
      email: 'admin@restaurant.com',
      password: 'password123',
      phone: '123-456-7890',
      role: 'admin'
    });
    users.push(defaultAdmin);

    // Create 2 additional admins (for multiple restaurant owners)
    const admin2 = await User.create({
      name: 'Mario Rossi',
      email: 'mario@restaurant.com',
      password: 'password123',
      phone: '234-567-8901',
      role: 'admin'
    });
    const admin3 = await User.create({
      name: 'Yuki Tanaka',
      email: 'yuki@restaurant.com',
      password: 'password123',
      phone: '345-678-9012',
      role: 'admin'
    });
    users.push(admin2, admin3);

    // Create 47 Customers
    for (let i = 1; i <= 47; i++) {
      const customer = await User.create({
        name: `Customer User ${i}`,
        email: `customer${i}@example.com`,
        password: 'password123',
        phone: `555-010-${String(i).padStart(2, '0')}`,
        role: 'customer'
      });
      users.push(customer);
    }
    console.log(`Seeded ${users.length} users successfully.`);

    // 3. Create 10 Restaurants
    console.log('Seeding restaurants...');
    const restaurants = [];
    const restaurantNames = [
      'La Bella Italia',
      'Sakura Sushi Bar',
      'El Taco Loco',
      'Taj Mahal Palace',
      'Le Petit Paris',
      'The Grill House',
      'Golden Dragon',
      'Orchid Thai',
      'Santorini Tavern',
      'Tapas Barcelona'
    ];

    for (let i = 0; i < 10; i++) {
      // Assign owner randomly among the 3 admins
      const owner = users[i % 3];
      
      const restaurant = await Restaurant.create({
        name: restaurantNames[i],
        description: descriptions[i % descriptions.length],
        cuisine: cuisinesList[i % cuisinesList.length],
        location: locations[i],
        address: `${100 + i * 25} Culinary Way, Suite ${10 + i}`,
        contactDetails: {
          phone: `800-555-${String(1000 + i)}`,
          email: `info@${restaurantNames[i].toLowerCase().replace(/\s+/g, '')}.com`
        },
        openingHours: {
          open: '11:00',
          close: '23:00'
        },
        ownerId: owner._id,
        photos: [] // Will start empty
      });
      restaurants.push(restaurant);
    }
    console.log(`Seeded ${restaurants.length} restaurants successfully.`);

    // 4. Create Tables for each Restaurant
    console.log('Seeding tables...');
    const tables = [];
    // Define 6 standard tables per restaurant
    const tableTemplates = [
      { num: '1', cap: 2 },
      { num: '2', cap: 2 },
      { num: '3', cap: 4 },
      { num: '4', cap: 4 },
      { num: '5', cap: 6 },
      { num: '6', cap: 8 },
      { num: '7', cap: 10 }
    ];

    for (const res of restaurants) {
      for (const t of tableTemplates) {
        const table = await Table.create({
          restaurantId: res._id,
          tableNumber: t.num,
          capacity: t.cap,
          status: 'available'
        });
        tables.push(table);
      }
    }
    console.log(`Seeded ${tables.length} tables successfully.`);

    // 5. Create Time Slots for each Restaurant
    console.log('Seeding time slots...');
    const timeSlots = [];
    const slotTimes = [
      { start: '11:30', end: '13:30' },
      { start: '13:30', end: '15:30' },
      { start: '17:30', end: '19:30' },
      { start: '19:30', end: '21:30' },
      { start: '21:00', end: '23:00' }
    ];

    for (const res of restaurants) {
      for (const st of slotTimes) {
        const slot = await TimeSlot.create({
          restaurantId: res._id,
          startTime: st.start,
          endTime: st.end,
          isAvailable: true
        });
        timeSlots.push(slot);
      }
    }
    console.log(`Seeded ${timeSlots.length} time slots successfully.`);

    // 6. Create 20 Reviews
    console.log('Seeding reviews...');
    const reviews = [];
    // Pick 20 customers to leave reviews at various restaurants
    for (let i = 0; i < 20; i++) {
      const customer = users[3 + i]; // Offset by 3 to skip admins
      const restaurant = restaurants[i % 10];
      const rating = (i % 3) + 3; // Rating of 3, 4, or 5 stars

      const review = await Review.create({
        customerId: customer._id,
        restaurantId: restaurant._id,
        rating: rating,
        comment: reviewerComments[i % reviewerComments.length]
      });
      reviews.push(review);
    }
    console.log(`Seeded ${reviews.length} reviews. Ratings aggregated to restaurants.`);

    // 7. Create 100 Reservations
    console.log('Seeding reservations...');
    const reservationStatuses = ['approved', 'pending', 'cancelled', 'rejected'];
    const specialRequests = [
      'Window seat if available, please.',
      'Celebrating our 5th wedding anniversary!',
      'Requires wheelchair access.',
      'High chair needed for a toddler.',
      'Allergy: Gluten-free options needed.',
      ''
    ];

    const today = new Date();

    for (let i = 0; i < 100; i++) {
      // Pick random customer
      const customer = users[3 + (i % 47)]; // Skip admins
      // Pick random restaurant
      const restaurant = restaurants[i % 10];
      // Pick random table at that restaurant
      const resTables = tables.filter((t) => t.restaurantId.toString() === restaurant._id.toString());
      const table = resTables[i % resTables.length];
      // Pick random slot
      const resSlots = timeSlots.filter((s) => s.restaurantId.toString() === restaurant._id.toString());
      const slot = resSlots[i % resSlots.length];

      // Distribute dates: 30 past reservations, 10 today, 60 future
      let bookingDate = new Date();
      if (i < 30) {
        // Past date (between 1 and 30 days ago)
        bookingDate.setDate(today.getDate() - (i + 1));
      } else if (i < 40) {
        // Today
        bookingDate = today;
      } else {
        // Future date (between 1 and 60 days from now)
        bookingDate.setDate(today.getDate() + (i - 39));
      }

      bookingDate.setHours(0, 0, 0, 0);

      // Status distribution: past ones are approved. Future ones are approved, pending or cancelled
      let status = 'approved';
      if (bookingDate > today) {
        status = reservationStatuses[i % reservationStatuses.length];
      }

      // Guest count between 1 and table capacity
      const guestCount = Math.max(1, i % table.capacity + 1);

      await Reservation.create({
        customerId: customer._id,
        restaurantId: restaurant._id,
        tableId: table._id,
        date: bookingDate,
        timeSlotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        guestCount,
        status,
        specialRequests: specialRequests[i % specialRequests.length],
        qrCode: `dummy_qr_data_reservation_${i}`
      });
    }
    console.log('Seeded 100 reservations successfully.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
