import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaCalendarAlt, FaClock, FaUsers, FaPen, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import './ReservationForm.css';

const ReservationForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Get tomorrow's date for minimum input date
  const getMinDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!user) {
      showToast('Please log in to reserve a table', 'warning');
      navigate('/login');
      return;
    }

    const fetchDetailsAndSlots = async () => {
      try {
        const [resDetails, resSlots] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/restaurants/${id}/slots`)
        ]);
        setRestaurant(resDetails.data.data.restaurant);
        // Only show available slots
        const activeSlots = resSlots.data.data.filter((s) => s.isAvailable);
        setSlots(activeSlots);
      } catch (err) {
        showToast('Failed to load reservation requirements.', 'error');
        navigate('/restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailsAndSlots();
  }, [id, user, navigate, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) {
      showToast('Please select a date', 'warning');
      return;
    }
    if (!selectedSlot) {
      showToast('Please select a time slot', 'warning');
      return;
    }
    if (guestCount < 1) {
      showToast('Guest count must be at least 1', 'warning');
      return;
    }

    // Find the times from selected slot
    const slotObj = slots.find((s) => s._id === selectedSlot);
    if (!slotObj) return;

    setSubmitting(true);
    try {
      const res = await api.post('/reservations', {
        restaurantId: id,
        date,
        startTime: slotObj.startTime,
        endTime: slotObj.endTime,
        guestCount,
        specialRequests,
        timeSlotId: slotObj._id
      });

      showToast('Reservation requested successfully!', 'success');
      setBookingSuccessData(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Table reservation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!restaurant) return null;

  if (bookingSuccessData) {
    return (
      <div className="booking-success-container flex-center container">
        <div className="success-card glass text-center animate-slide flex-center">
          <FaCheckCircle className="success-icon success" />
          <h2 className="title-serif">Booking Request Placed!</h2>
          <p className="success-intro">
            Your reservation at <strong>{restaurant.name}</strong> is currently <strong>Pending Approval</strong>.
          </p>
          <div className="booking-summary-box">
            <p><strong>Date:</strong> {new Date(bookingSuccessData.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {bookingSuccessData.startTime} - {bookingSuccessData.endTime}</p>
            <p><strong>Guests:</strong> {bookingSuccessData.guestCount} People</p>
          </div>
          {bookingSuccessData.qrCode && (
            <div className="qr-wrapper flex-center">
              <img src={bookingSuccessData.qrCode} alt="Reservation QR" className="qr-img" />
              <p className="qr-desc">Scan at the front desk upon arrival</p>
            </div>
          )}
          <div className="success-actions flex gap-2">
            <Link to="/my-bookings" className="btn btn-primary">Go to My Bookings</Link>
            <Link to="/restaurants" className="btn btn-secondary">Explore Other Spots</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-form-page container">
      <div className="form-layout-wrapper glass animate-slide">
        <div className="form-header">
          <Link to={`/restaurants/${id}`} className="back-link flex-center"><FaArrowLeft /> Restaurant Details</Link>
          <h2 className="title-serif">Reserve a Table at <span className="accent-text">{restaurant.name}</span></h2>
          <p>Location: {restaurant.location} | Operating Hours: {restaurant.openingHours.open} - {restaurant.openingHours.close}</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form-element">
          <div className="form-group-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="date"><FaCalendarAlt /> Select Date</label>
              <input
                type="date"
                id="date"
                className="form-control"
                min={getMinDateString()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="slot"><FaClock /> Time Slot</label>
              <select
                id="slot"
                className="form-control"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                required
              >
                <option value="">Choose a slot</option>
                {slots.length === 0 ? (
                  <option value="" disabled>No slots configured by admin</option>
                ) : (
                  slots.map((s) => (
                    <option key={s._id} value={s._id}>{s.startTime} - {s.endTime}</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="guests"><FaUsers /> Number of Guests</label>
              <input
                type="number"
                id="guests"
                className="form-control"
                min="1"
                max="20"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="special"><FaPen /> Special Requests</label>
            <textarea
              id="special"
              rows="4"
              className="form-control"
              placeholder="e.g. Allergies, celebrating anniversary, seating preferences..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary btn-submit-booking" disabled={submitting}>
            {submitting ? <div className="spinner"></div> : 'Confirm Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm;
