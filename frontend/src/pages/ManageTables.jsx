import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaTh, FaPlus, FaTrashAlt, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import './ManageTables.css';

const ManageTables = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedResId, setSelectedResId] = useState('');
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTable, setActiveTable] = useState(null);

  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [status, setStatus] = useState('available');

  // Load owned restaurants
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
        showToast('Could not load restaurant outlets.', 'error');
      }
    };
    fetchOwned();
  }, [user.id, showToast]);

  // Load tables for selected restaurant
  const fetchTables = useCallback(async () => {
    if (!selectedResId) return;
    setLoading(true);
    try {
      const res = await api.get(`/restaurants/${selectedResId}/tables`);
      setTables(res.data.data);
    } catch (err) {
      showToast('Could not load table setups.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedResId, showToast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleOpenAdd = () => {
    setTableNumber('');
    setCapacity(4);
    setStatus('available');
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (table) => {
    setActiveTable(table);
    setTableNumber(table.tableNumber);
    setCapacity(table.capacity);
    setStatus(table.status);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      showToast('Table number is required', 'warning');
      return;
    }

    try {
      if (isAdding) {
        await api.post(`/restaurants/${selectedResId}/tables`, {
          tableNumber,
          capacity,
          status
        });
        showToast('Table added successfully!', 'success');
      } else {
        await api.put(`/tables/${activeTable._id}`, {
          tableNumber,
          capacity,
          status
        });
        showToast('Table details updated!', 'success');
      }
      setIsAdding(false);
      setIsEditing(false);
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      showToast('Table removed successfully', 'success');
      fetchTables();
    } catch (err) {
      showToast('Failed to delete table.', 'error');
    }
  };

  return (
    <div className="manage-tables-page animate-fade">
      <div className="manage-header flex-between">
        <div>
          <h2 className="title-serif">Manage <span className="accent-text">Tables</span></h2>
          <p>Configure seating arrangements, capacities, and maintenance status</p>
        </div>
        {selectedResId && !isAdding && !isEditing && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <FaPlus /> Add Table
          </button>
        )}
      </div>

      {/* Select Restaurant Dropdown */}
      <div className="restaurant-selector-box glass">
        <label className="form-label">Active Restaurant Outlet</label>
        <select
          value={selectedResId}
          onChange={(e) => { setSelectedResId(e.target.value); setIsAdding(false); setIsEditing(false); }}
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

      {isAdding || isEditing ? (
        /* Create/Edit Form */
        <div className="form-card glass animate-slide" style={{ maxWidth: '500px' }}>
          <div className="form-card-header flex-between">
            <h3 className="title-serif">{isAdding ? 'Add Seating Table' : 'Edit Seating Table'}</h3>
            <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="close-btn"><FaTimes /></button>
          </div>

          <form onSubmit={handleSubmit} className="table-crud-form">
            <div className="form-group">
              <label className="form-label">Table Number / Label</label>
              <input
                type="text"
                placeholder="e.g. Table 1, Room A-1"
                className="form-control"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Seat Capacity</label>
              <input
                type="number"
                className="form-control"
                min="1"
                max="30"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="available">Available for Booking</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              {isAdding ? 'Save Table' : 'Update Table'}
            </button>
          </form>
        </div>
      ) : loading ? (
        <div className="flex-center" style={{ minHeight: '30vh' }}>
          <div className="spinner"></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="empty-state glass flex-center">
          <FaTh className="empty-icon" />
          <h3>No Tables Added</h3>
          <p>Please register seating tables for this restaurant to allow customer reservations.</p>
          {selectedResId && <button onClick={handleOpenAdd} className="btn btn-primary">Add Table</button>}
        </div>
      ) : (
        /* Tables Grid List */
        <div className="tables-grid">
          {tables.map((table) => (
            <div key={table._id} className={`table-admin-card glass ${table.status}`}>
              <div className="card-top flex-between">
                <FaTh className="table-icon" />
                <span className={`status-pill ${table.status}`}>{table.status}</span>
              </div>
              <div className="card-center text-center">
                <h3>{table.tableNumber}</h3>
                <p>{table.capacity} Seats</p>
              </div>
              <div className="card-actions flex-center">
                <button onClick={() => handleOpenEdit(table)} className="btn btn-secondary btn-sm" title="Edit"><FaEdit /> Edit</button>
                <button onClick={() => handleDelete(table._id)} className="btn btn-danger btn-sm" title="Delete"><FaTrashAlt /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageTables;
