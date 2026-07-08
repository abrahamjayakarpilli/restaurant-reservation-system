import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaQrcode,
  FaTimes,
  FaChartPie,
  FaHistory,
  FaEdit,
  FaInfoCircle
} from 'react-icons/fa';
import api from '../services/api';
import './MyReservations.css';

const MyReservations = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedQR, setSelectedQR] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editSlot, setEditSlot] = useState('');
  const [editGuests, setEditGuests] = useState(2);
  const [editRequests, setEditRequests] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [updating, setUpdating] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/reservations/my-bookings');
      setBookings(res.data.data);
    } catch (err) {
      showToast('Could not load reservation history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle Cancel Booking
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.patch(`/reservations/${id}/status`, { status: 'cancelled' });
      showToast('Reservation cancelled successfully', 'success');
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel reservation.', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = async (booking) => {
    setEditBooking(booking);
    // Format date as YYYY-MM-DD
    const bDate = new Date(booking.date);
    setEditDate(bDate.toISOString().split('T')[0]);
    setEditGuests(booking.guestCount);
    setEditRequests(booking.specialRequests || '');

    // Fetch slots for this restaurant
    try {
      const res = await api.get(`/restaurants/${booking.restaurantId._id}/slots`);
      const activeSlots = res.data.data.filter((s) => s.isAvailable);
      setAvailableSlots(activeSlots);
      
      // Match starting time to slot ID
      const matched = activeSlots.find((s) => s.startTime === booking.startTime);
      setEditSlot(matched ? matched._id : '');
    } catch (e) {
      showToast('Failed to load slots for this restaurant.', 'error');
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editSlot) {
      showToast('Please select a time slot', 'warning');
      return;
    }

    const slotObj = availableSlots.find((s) => s._id === editSlot);
    if (!slotObj) return;

    setUpdating(true);
    try {
      await api.put(`/reservations/${editBooking._id}`, {
        date: editDate,
        startTime: slotObj.startTime,
        endTime: slotObj.endTime,
        guestCount: editGuests,
        specialRequests: editRequests,
        timeSlotId: slotObj._id
      });

      showToast('Reservation modified successfully. Awaiting admin review.', 'success');
      setEditBooking(null);
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to modify reservation.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Statistics calculation
  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter((b) => b.status === 'approved' && new Date(b.date) >= new Date().setHours(0, 0, 0, 0));
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const pastBookings = bookings.filter((b) => new Date(b.date) < new Date().setHours(0, 0, 0, 0) && b.status === 'approved');

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page container animate-fade">
      <div className="bookings-header">
        <h2 className="title-serif">My <span className="accent-text">Reservations</span></h2>
        <p>Manage and trace your upcoming dining slots and booking history</p>
      </div>

      {/* Stats Counter Section */}
      <section className="stats-section">
        <div className="stat-card glass text-center">
          <FaChartPie className="stat-icon info" />
          <h3 className="stat-number">{totalBookings}</h3>
          <p className="stat-label">Total Requests</p>
        </div>

        <div className="stat-card glass text-center">
          <FaCalendarAlt className="stat-icon success" />
          <h3 className="stat-number">{upcomingBookings.length}</h3>
          <p className="stat-label">Upcoming Confirmed</p>
        </div>

        <div className="stat-card glass text-center">
          <FaInfoCircle className="stat-icon warning" />
          <h3 className="stat-number">{pendingBookings.length}</h3>
          <p className="stat-label">Pending Approval</p>
        </div>

        <div className="stat-card glass text-center">
          <FaHistory className="stat-icon" />
          <h3 className="stat-number">{pastBookings.length}</h3>
          <p className="stat-label">Past Dinings</p>
        </div>
      </section>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="empty-state glass flex-center">
          <FaCalendarAlt className="empty-icon" />
          <h3>No Reservations Found</h3>
          <p>You haven't reserved any tables yet. Ready for an exceptional meal?</p>
          <Link to="/restaurants" className="btn btn-primary">Find a Restaurant</Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const isPast = new Date(booking.date) < new Date().setHours(0, 0, 0, 0);
            return (
              <div key={booking._id} className="booking-card glass">
                <div className="booking-restaurant-photo">
                  {booking.restaurantId?.photos && booking.restaurantId?.photos[0] ? (
                    <img src={`http://localhost:5000/${booking.restaurantId.photos[0]}`} alt={booking.restaurantId.name} />
                  ) : (
                    <div className="photo-placeholder flex-center"><FaUtensils /></div>
                  )}
                </div>

                <div className="booking-details">
                  <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                  <h3 className="title-serif">{booking.restaurantId?.name || 'Restaurant Venue'}</h3>
                  
                  <div className="booking-info-meta">
                    <p><FaCalendarAlt className="accent-text" /> {new Date(booking.date).toLocaleDateString()}</p>
                    <p><FaClock className="accent-text" /> {booking.startTime} - {booking.endTime}</p>
                    <p><FaUsers className="accent-text" /> {booking.guestCount} Guests</p>
                  </div>
                  {booking.specialRequests && (
                    <p className="requests-preview"><strong>Request:</strong> "{booking.specialRequests}"</p>
                  )}
                </div>

                <div className="booking-actions flex-center">
                  {!isPast && (booking.status === 'approved' || booking.status === 'pending') && (
                    <>
                      {booking.qrCode && (
                        <button
                          onClick={() => setSelectedQR(booking)}
                          className="btn btn-secondary btn-sm"
                          title="Show QR Code"
                        >
                          <FaQrcode /> QR Check-in
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(booking)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Booking"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="btn btn-danger btn-sm"
                        title="Cancel Booking"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {isPast && booking.status === 'approved' && (
                    <Link to={`/restaurants/${booking.restaurantId?._id}`} className="btn btn-primary btn-sm">
                      Leave a Review
                    </Link>
                  )}
                  {booking.status === 'cancelled' && (
                    <span className="cancelled-text">Cancelled</span>
                  )}
                  {booking.status === 'rejected' && (
                    <span className="rejected-text text-danger font-bold">Rejected by Admin</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="modal-overlay flex-center" onClick={() => setSelectedQR(null)}>
          <div className="modal-content glass animate-slide text-center" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-between">
              <h3 className="title-serif">QR Code Check-In</h3>
              <button onClick={() => setSelectedQR(null)} className="close-modal-btn"><FaTimes /></button>
            </div>
            <p>Show this code at the reception of <strong>{selectedQR.restaurantId?.name}</strong></p>
            <div className="qr-box flex-center">
              <img src={selectedQR.qrCode} alt="Reservation QR" className="modal-qr-image" />
            </div>
            <div className="modal-summary">
              <p><strong>Schedule:</strong> {new Date(selectedQR.date).toLocaleDateString()} @ {selectedQR.startTime}</p>
              <p><strong>Guests:</strong> {selectedQR.guestCount} People</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editBooking && (
        <div className="modal-overlay flex-center">
          <div className="modal-content glass animate-slide" style={{ maxWidth: '500px' }}>
            <div className="modal-header flex-between">
              <h3 className="title-serif">Edit Reservation</h3>
              <button onClick={() => setEditBooking(null)} className="close-modal-btn"><FaTimes /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="edit-booking-form">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <select
                  className="form-control"
                  value={editSlot}
                  onChange={(e) => setEditSlot(e.target.value)}
                  required
                >
                  <option value="">Select a slot</option>
                  {availableSlots.map((s) => (
                    <option key={s._id} value={s._id}>{s.startTime} - {s.endTime}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Guests</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="20"
                  value={editGuests}
                  onChange={(e) => setEditGuests(parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Special Requests</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={editRequests}
                  onChange={(e) => setEditRequests(e.target.value)}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={updating}>
                {updating ? <div className="spinner"></div> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservations;
