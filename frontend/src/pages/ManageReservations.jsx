import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaClock, FaUsers, FaCheck, FaTimes, FaFilter, FaInfoCircle, FaPhone, FaEnvelope } from 'react-icons/fa';
import api from '../services/api';
import './ManageReservations.css';

const ManageReservations = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedResId, setSelectedResId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load owned restaurants
  useEffect(() => {
    const fetchOwned = async () => {
      try {
        const res = await api.get('/restaurants');
        const owned = res.data.data.filter((r) => r.ownerId === user.id || r.ownerId?._id === user.id);
        setRestaurants(owned);
      } catch (err) {
        showToast('Could not load restaurant venues.', 'error');
      }
    };
    fetchOwned();
  }, [user.id, showToast]);

  // Load admin reservations with filters
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedResId) params.restaurantId = selectedResId;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedDate) params.date = selectedDate;

      const res = await api.get('/reservations/admin-bookings', { params });
      setReservations(res.data.data);
    } catch (err) {
      showToast('Could not load reservation data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedResId, selectedStatus, selectedDate, showToast]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleUpdateStatus = async (id, status) => {
    const verb = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'cancel';
    if (!window.confirm(`Are you sure you want to ${verb} this reservation request?`)) return;

    try {
      await api.patch(`/reservations/${id}/status`, { status });
      showToast(`Reservation successfully ${status}!`, 'success');
      fetchReservations();
    } catch (err) {
      showToast('Failed to update reservation status.', 'error');
    }
  };

  const handleClearFilters = () => {
    setSelectedResId('');
    setSelectedStatus('');
    setSelectedDate('');
  };

  return (
    <div className="manage-bookings-page animate-fade">
      <div className="manage-header">
        <h2 className="title-serif">Manage <span className="accent-text">Reservations</span></h2>
        <p>Approve pending requests, reject duplicates, and filter customer booking sheets</p>
      </div>

      {/* Filter Toolbar */}
      <section className="filter-toolbar glass flex-between flex-wrap gap-4">
        <div className="toolbar-title flex-center gap-2">
          <FaFilter /> Filters
        </div>
        <div className="toolbar-filters-grid flex-grow flex gap-4">
          <div className="filter-item">
            <select
              value={selectedResId}
              onChange={(e) => setSelectedResId(e.target.value)}
              className="form-control"
            >
              <option value="">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-control"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-item">
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <button onClick={handleClearFilters} className="clear-btn">Clear Filters</button>
      </section>

      {/* Bookings List */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: '40vh' }}>
          <div className="spinner"></div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="empty-state glass flex-center">
          <FaCalendarAlt className="empty-icon" />
          <h3>No Reservations Found</h3>
          <p>No bookings match the filtered criteria. Check your options or review standard lists.</p>
        </div>
      ) : (
        <div className="admin-bookings-list">
          {reservations.map((booking) => (
            <div key={booking._id} className="booking-admin-card glass">
              <div className="card-left-info">
                <span className={`status-badge-admin ${booking.status}`}>{booking.status}</span>
                <h3 className="title-serif">{booking.restaurantId?.name}</h3>
                
                <div className="meta-schedule-grid">
                  <p><FaCalendarAlt className="accent-text" /> <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                  <p><FaClock className="accent-text" /> <strong>Slot:</strong> {booking.startTime} - {booking.endTime}</p>
                  <p><FaUsers className="accent-text" /> <strong>Table:</strong> {booking.tableId?.tableNumber ? `Table ${booking.tableId.tableNumber}` : 'Auto-Allocated'} | {booking.guestCount} Guests</p>
                </div>

                <div className="customer-contact-box">
                  <p><strong>Customer:</strong> {booking.customerId?.name || 'Guest'}</p>
                  <p className="flex gap-2"><FaPhone /> {booking.customerId?.phone || 'N/A'} <FaEnvelope /> {booking.customerId?.email || 'N/A'}</p>
                </div>

                {booking.specialRequests && (
                  <div className="requests-note flex gap-2">
                    <FaInfoCircle className="accent-text mt-1" />
                    <p><strong>Special Request:</strong> "{booking.specialRequests}"</p>
                  </div>
                )}
              </div>

              <div className="card-right-actions flex-center">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(booking._id, 'approved')}
                      className="btn btn-primary btn-sm flex-center gap-1"
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(booking._id, 'rejected')}
                      className="btn btn-danger btn-sm flex-center gap-1"
                    >
                      <FaTimes /> Reject
                    </button>
                  </>
                )}
                {booking.status === 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                    className="btn btn-danger btn-sm"
                  >
                    Cancel Booking
                  </button>
                )}
                {(booking.status === 'cancelled' || booking.status === 'rejected') && (
                  <span className="closed-label font-bold text-uppercase">Inactive</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageReservations;
