import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaClock, FaPlus, FaTrashAlt, FaCheck, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import api from '../services/api';
import './ManageTimeSlots.css';

const ManageTimeSlots = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedResId, setSelectedResId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [isAvailable, setIsAvailable] = useState(true);

  // Fetch owned restaurants
  useEffect(() => {
    const fetchOwned = async () => {
      try {
        const res = await api.get('/restaurants');
        const owned = res.data.data.filter((r) => r.ownerId === user.id || r.ownerId?._id === user.id);
        setRestaurants(owned);
        if (owned.length > 0) {
          setSelectedResId(owned[0]._id);
        }
      } catch (err) {
        showToast('Could not load restaurants.', 'error');
      }
    };
    fetchOwned();
  }, [user.id, showToast]);

  // Fetch slots
  const fetchSlots = useCallback(async () => {
    if (!selectedResId) return;
    setLoading(true);
    try {
      const res = await api.get(`/restaurants/${selectedResId}/slots`);
      setSlots(res.data.data);
    } catch (err) {
      showToast('Could not load time slots.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedResId, showToast]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleOpenAdd = () => {
    setStartTime('18:00');
    setEndTime('20:00');
    setIsAvailable(true);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Time regex HH:MM
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      showToast('Please enter times in HH:MM format (24h)', 'warning');
      return;
    }

    if (startTime >= endTime) {
      showToast('End time must be after start time', 'warning');
      return;
    }

    try {
      await api.post(`/restaurants/${selectedResId}/slots`, {
        startTime,
        endTime,
        isAvailable
      });
      showToast('Time slot created successfully!', 'success');
      setIsAdding(false);
      fetchSlots();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create slot.', 'error');
    }
  };

  const handleToggleAvailability = async (slot) => {
    try {
      await api.put(`/slots/${slot._id}`, {
        isAvailable: !slot.isAvailable
      });
      showToast('Time slot status updated!', 'success');
      fetchSlots();
    } catch (err) {
      showToast('Failed to update slot status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;
    try {
      await api.delete(`/slots/${id}`);
      showToast('Time slot removed successfully', 'success');
      fetchSlots();
    } catch (err) {
      showToast('Failed to delete time slot.', 'error');
    }
  };

  return (
    <div className="manage-slots-page animate-fade">
      <div className="manage-header flex-between">
        <div>
          <h2 className="title-serif">Manage <span className="accent-text">Time Slots</span></h2>
          <p>Establish operational dining slots and toggle scheduling availability</p>
        </div>
        {selectedResId && !isAdding && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <FaPlus /> Add Time Slot
          </button>
        )}
      </div>

      {/* Select Restaurant Dropdown */}
      <div className="restaurant-selector-box glass">
        <label className="form-label">Active Restaurant Outlet</label>
        <select
          value={selectedResId}
          onChange={(e) => { setSelectedResId(e.target.value); setIsAdding(false); }}
          className="form-control"
        >
          {restaurants.length === 0 ? (
            <option value="">No restaurants registered</option>
          ) : (
            restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))
          )}
        </select>
      </div>

      {isAdding ? (
        /* Create Slot Form */
        <div className="form-card glass animate-slide" style={{ maxWidth: '500px' }}>
          <div className="form-card-header flex-between">
            <h3 className="title-serif">Add Time Slot</h3>
            <button onClick={() => setIsAdding(false)} className="close-btn"><FaTimes /></button>
          </div>

          <form onSubmit={handleSubmit} className="slot-crud-form">
            <div className="form-group">
              <label className="form-label">Start Time (HH:MM)</label>
              <input
                type="text"
                placeholder="18:00"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time (HH:MM)</label>
              <input
                type="text"
                placeholder="20:00"
                className="form-control"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Availability</label>
              <select
                className="form-control"
                value={isAvailable ? 'true' : 'false'}
                onChange={(e) => setIsAvailable(e.target.value === 'true')}
              >
                <option value="true">Available for Bookings</option>
                <option value="false">Mark as Closed / Unavailable</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">Save Slot</button>
          </form>
        </div>
      ) : loading ? (
        <div className="flex-center" style={{ minHeight: '30vh' }}>
          <div className="spinner"></div>
        </div>
      ) : slots.length === 0 ? (
        <div className="empty-state glass flex-center">
          <FaClock className="empty-icon" />
          <h3>No Time Slots Set</h3>
          <p>No operational intervals have been configured. Add slots to start accepting bookings.</p>
          {selectedResId && <button onClick={handleOpenAdd} className="btn btn-primary">Add Time Slot</button>}
        </div>
      ) : (
        /* Slots List */
        <div className="slots-panel-list glass">
          <div className="table-responsive">
            <table className="slots-table">
              <thead>
                <tr>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Availability Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot._id} className={!slot.isAvailable ? 'disabled-row' : ''}>
                    <td className="font-bold">{slot.startTime}</td>
                    <td className="font-bold">{slot.endTime}</td>
                    <td>
                      <button
                        onClick={() => handleToggleAvailability(slot)}
                        className="toggle-status-btn flex-center gap-2"
                        title={slot.isAvailable ? 'Click to Mark Unavailable' : 'Click to Make Available'}
                      >
                        {slot.isAvailable ? (
                          <>
                            <FaToggleOn className="toggle-icon success-color" />
                            <span className="success-color font-bold">Active</span>
                          </>
                        ) : (
                          <>
                            <FaToggleOff className="toggle-icon danger-color" />
                            <span className="danger-color font-bold">Closed</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(slot._id)}
                        className="btn-delete flex-center"
                        title="Delete slot"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTimeSlots;
