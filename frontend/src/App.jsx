import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoutes from './components/ProtectedRoutes';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurants from './pages/Restaurants';
import RestaurantDetails from './pages/RestaurantDetails';
import NotFound from './pages/NotFound';

// Protected Customer/Shared pages
import ReservationForm from './pages/ReservationForm';
import MyReservations from './pages/MyReservations';
import Profile from './pages/Profile';

// Protected Admin pages
import AdminDashboard from './pages/AdminDashboard';
import ManageRestaurants from './pages/ManageRestaurants';
import ManageTables from './pages/ManageTables';
import ManageTimeSlots from './pages/ManageTimeSlots';
import ManageReservations from './pages/ManageReservations';

function App() {
  return (
    <Routes>
      {/* Public Pages wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/:id" element={<RestaurantDetails />} />
        
        {/* Protected Customer Routes */}
        <Route element={<ProtectedRoutes allowedRoles={['customer', 'admin']} />}>
          <Route path="/restaurants/:id/book" element={<ReservationForm />} />
          <Route path="/my-bookings" element={<MyReservations />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Protected Admin Pages wrapped in AdminLayout */}
      <Route element={<ProtectedRoutes allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/restaurants" element={<ManageRestaurants />} />
          <Route path="/admin/tables" element={<ManageTables />} />
          <Route path="/admin/slots" element={<ManageTimeSlots />} />
          <Route path="/admin/reservations" element={<ManageReservations />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
