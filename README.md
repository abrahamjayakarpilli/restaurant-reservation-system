# Restaurant Reservation System (TableCraft)

A production-ready, full-stack Restaurant Reservation System built from scratch. Features role-based access control, automatic table allocation with capacity and overlap checks, QR code check-ins, custom analytics dashboards, and light/dark theme toggles.

---

## Technical Stack

- **Frontend**: ReactJS (Vite, React Router, Axios, Context API, CSS Variables, React Icons)
- **Backend**: NodeJS, ExpressJS
- **Database**: MongoDB with Mongoose
- **Security**: Helmet, CORS, Express Rate Limit, Mongo Sanitize, XSS Clean, Bcrypt password hashing, JWT Authentication.

---

## Features

### Customer Features
- **Landing & Discovery**: Dynamic search by name, cuisine, location, or rating. Beautiful category list options.
- **Table Booking**: Select date, time slot, and guests count. Automated table allocator finds the smallest matching capacity table not already reserved. Generates base64 QR Code on booking confirmation.
- **Reservations Control**: Edit bookings schedule, cancel pending/approved slots, view reservation history logs.
- **Review Feed**: Submit, edit, or delete ratings (1-5 stars) and comments. Automatically triggers restaurant rating average updates.
- **Profile Configuration**: Edit profile information, change passwords, and upload custom avatars (Multer middleware upload).

### Restaurant Admin Features
- **Analytics Dashboard**: Trace metrics including Total bookings count, Today's bookings count, Monthly bookings count, Popular time slots, and Estimated Revenue stats.
- **Outlets Management**: Create, update, delete, or upload photo galleries for owned restaurants.
- **Seating Configuration**: Configure tables capacity (number of seats) and toggle maintenance status.
- **Time Slots Control**: Set custom operational slots (HH:MM) and toggle availability status.
- **Bookings Management**: View all incoming requests, filter by restaurant/status/date, and Approve or Reject bookings.

---

## Project Structure

```
restaurant-reservation-system/
├── backend/
│   ├── config/          # DB config, DB connection script
│   ├── controllers/     # MVC controller layers (Auth, Restaurant, Table, Slots, Reviews, Bookings)
│   ├── middleware/      # Express middlewares (Auth protect, Upload, Error handler)
│   ├── models/          # Mongoose Schemas (User, Restaurant, Table, Reservation, TimeSlot, Review)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic helpers (table allocation logic, QR generator)
│   ├── utils/           # Database seeder script
│   ├── validators/      # express-validator schemas
│   ├── uploads/         # Static uploads storage
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI elements (Navbar, Sidebar, Footer, ProtectedRoutes)
│   │   ├── context/     # Global state providers (Auth, Theme, Toast notifications)
│   │   ├── layouts/     # Main Layout, Admin Layout
│   │   ├── pages/       # Router page components
│   │   ├── services/    # Axios API service instances
│   │   ├── index.css    # Global stylesheet design tokens
│   │   ├── App.jsx      # Navigation routing setup
│   │   └── main.jsx     # Bootstrap mount
│   ├── package.json
│   └── vite.config.js
└── Postman_Collection.json
```

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file inside the `backend` folder with:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant-reservation
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
NODE_ENV=development
```

---

## Installation & Setup

### Prerequisites
- Node.js installed (version >= 18)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Database Seeding (Run this first to load sample data)
In the `backend` directory, run:
```bash
npm install
node utils/seeder.js
```
*Seeds 50 users (1 Default Admin: `admin@restaurant.com` / `password123`), 10 restaurants, tables, slots, 100 reservations, and 20 reviews.*

### 2. Run Backend
In the `backend` directory, run:
```bash
npm run dev
```
*Starts Express on port 5000.*

### 3. Run Frontend
In the `frontend` directory, run:
```bash
npm install
npm run dev
```
*Launches Vite hot-reloading dev server.*

---

## API Documentation

### Auth Endpoints
- `POST /api/auth/register` - Create customer or admin account
- `POST /api/auth/login` - Obtain JWT Token
- `GET /api/auth/me` - Fetch profile metadata
- `PUT /api/auth/profile` - Update profile data
- `POST /api/auth/avatar` - Upload avatar image (Multer multipart)
- `PUT /api/auth/password` - Change account password

### Restaurant Profile
- `GET /api/restaurants` - List, filter, search, and sort restaurants
- `GET /api/restaurants/:id` - Details + tables & slots lists
- `POST /api/restaurants` - Register venue (Admin only)
- `PUT /api/restaurants/:id` - Edit restaurant details (Owner only)
- `POST /api/restaurants/:id/photos` - Upload gallery photos (Owner only)

### Table Allocations
- `GET /api/restaurants/:restaurantId/tables` - Get tables list
- `POST /api/restaurants/:restaurantId/tables` - Add table (Admin only)
- `PUT /api/tables/:id` - Edit table status or capacity (Owner only)

### Reservations
- `POST /api/reservations` - Book table (Auto-allocates free table)
- `GET /api/reservations/my-bookings` - History of customer bookings
- `GET /api/reservations/admin-bookings` - View requests (Admin only)
- `GET /api/reservations/analytics` - Financial & operational counts (Admin only)
- `PATCH /api/reservations/:id/status` - Approve/Reject/Cancel reservation
