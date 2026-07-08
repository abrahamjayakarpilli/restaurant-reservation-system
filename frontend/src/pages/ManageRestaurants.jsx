import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaUtensils, FaEdit, FaTrashAlt, FaCamera, FaPlus, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../services/api';
import './ManageRestaurants.css';

const ManageRestaurants = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    location: '',
    address: '',
    contactDetails: { phone: '', email: '' },
    openingHours: { open: '11:00', close: '23:00' }
  });

  // Photo uploads
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const fetchOwnedRestaurants = useCallback(async () => {
    try {
      const res = await api.get('/restaurants');
      // Filter restaurants owned by the current logged-in user
      const owned = res.data.data.filter((r) => r.ownerId === user.id || r.ownerId?._id === user.id);
      setRestaurants(owned);
    } catch (err) {
      showToast('Could not load restaurant settings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id, showToast]);

  useEffect(() => {
    fetchOwnedRestaurants();
  }, [fetchOwnedRestaurants]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        contactDetails: { ...prev.contactDetails, [field]: value }
      }));
    } else if (name.startsWith('hours.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        openingHours: { ...prev.openingHours, [field]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      cuisine: '',
      location: '',
      address: '',
      contactDetails: { phone: '', email: '' },
      openingHours: { open: '11:00', close: '23:00' }
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (res) => {
    setActiveRestaurant(res);
    setFormData({
      name: res.name,
      description: res.description,
      cuisine: res.cuisine.join(', '),
      location: res.location,
      address: res.address,
      contactDetails: {
        phone: res.contactDetails?.phone || '',
        email: res.contactDetails?.email || ''
      },
      openingHours: {
        open: res.openingHours?.open || '11:00',
        close: res.openingHours?.close || '23:00'
      }
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isCreating) {
        await api.post('/restaurants', formData);
        showToast('Restaurant registered successfully!', 'success');
      } else {
        await api.put(`/restaurants/${activeRestaurant._id}`, formData);
        showToast('Restaurant profile updated successfully!', 'success');
      }
      setIsEditing(false);
      setIsCreating(false);
      fetchOwnedRestaurants();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This will remove all associated tables and slots.')) return;
    try {
      await api.delete(`/restaurants/${id}`);
      showToast('Restaurant deleted successfully', 'success');
      fetchOwnedRestaurants();
    } catch (err) {
      showToast('Failed to delete restaurant.', 'error');
    }
  };

  // Handle Photo selection
  const handlePhotoSelect = (e) => {
    if (e.target.files) {
      setSelectedPhotos(Array.from(e.target.files));
    }
  };

  const handlePhotosUpload = async (e, id) => {
    e.preventDefault();
    if (selectedPhotos.length === 0) {
      showToast('Please select photos to upload', 'warning');
      return;
    }

    const formData = new FormData();
    selectedPhotos.forEach((file) => {
      formData.append('photos', file);
    });

    setUploadingPhotos(true);
    try {
      await api.post(`/restaurants/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Photos uploaded successfully!', 'success');
      setSelectedPhotos([]);
      fetchOwnedRestaurants();
    } catch (err) {
      showToast('Failed to upload photos.', 'error');
    } finally {
      setUploadingPhotos(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="manage-restaurants-page animate-fade">
      <div className="manage-header flex-between">
        <div>
          <h2 className="title-serif">Manage <span className="accent-text">Restaurants</span></h2>
          <p>Create, update, delete, or upload photos for your restaurants</p>
        </div>
        {!isCreating && !isEditing && (
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <FaPlus /> Register Restaurant
          </button>
        )}
      </div>

      {isCreating || isEditing ? (
        /* Create/Edit Form Container */
        <div className="form-card glass animate-slide">
          <div className="form-card-header flex-between">
            <h3 className="title-serif">{isCreating ? 'Register New Restaurant' : 'Update Restaurant Profile'}</h3>
            <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="close-btn"><FaTimes /></button>
          </div>

          <form onSubmit={handleSubmit} className="restaurant-crud-form">
            <div className="form-group-grid">
              <div className="form-group">
                <label className="form-label">Restaurant Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cuisines (comma-separated)</label>
                <input
                  type="text"
                  name="cuisine"
                  className="form-control"
                  placeholder="Italian, Pizza, Pasta"
                  value={formData.cuisine}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                rows="3"
                className="form-control"
                value={formData.description}
                onChange={handleFormChange}
                required
              ></textarea>
            </div>

            <div className="form-group-grid">
              <div className="form-group">
                <label className="form-label">Location / City Tag</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  placeholder="Downtown Manhattan, NY"
                  value={formData.location}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Physical Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  placeholder="123 Greenwich St"
                  value={formData.address}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="form-group-grid">
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  name="contact.phone"
                  className="form-control"
                  value={formData.contactDetails.phone}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  name="contact.email"
                  className="form-control"
                  value={formData.contactDetails.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="form-group-grid">
              <div className="form-group">
                <label className="form-label">Opening Time (HH:MM)</label>
                <input
                  type="text"
                  name="hours.open"
                  className="form-control"
                  placeholder="11:00"
                  value={formData.openingHours.open}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Closing Time (HH:MM)</label>
                <input
                  type="text"
                  name="hours.close"
                  className="form-control"
                  placeholder="23:00"
                  value={formData.openingHours.close}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              {isCreating ? 'Save Restaurant' : 'Update Profile'}
            </button>
          </form>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="empty-state glass flex-center">
          <FaUtensils className="empty-icon" />
          <h3>No Restaurants Configured</h3>
          <p>You haven't registered any restaurants yet. Register your first outlet to start taking reservations.</p>
          <button onClick={handleOpenCreate} className="btn btn-primary">Add Restaurant</button>
        </div>
      ) : (
        /* Restaurant list */
        <div className="restaurant-admin-list">
          {restaurants.map((res) => (
            <div key={res._id} className="restaurant-admin-card glass">
              <div className="res-card-header flex-between">
                <div>
                  <h3 className="title-serif">{res.name}</h3>
                  <span className="cuisine-badge">{res.cuisine.join(', ')}</span>
                </div>
                <div className="res-actions">
                  <button onClick={() => handleOpenEdit(res)} className="btn-icon edit" title="Edit"><FaEdit /></button>
                  <button onClick={() => handleDelete(res._id)} className="btn-icon delete" title="Delete"><FaTrashAlt /></button>
                </div>
              </div>

              <div className="res-details-content">
                <p><strong>Description:</strong> {res.description.substring(0, 100)}...</p>
                <p><strong>Address:</strong> <FaMapMarkerAlt /> {res.address}, {res.location}</p>
                <p><strong>Hours:</strong> {res.openingHours.open} - {res.openingHours.close}</p>
                <p><strong>Contact:</strong> {res.contactDetails.phone} | {res.contactDetails.email}</p>
              </div>

              {/* Photo Upload Panel */}
              <div className="photos-admin-panel">
                <h4>Restaurant Gallery ({res.photos.length} photos)</h4>
                
                {res.photos.length > 0 && (
                  <div className="photos-preview-strip">
                    {res.photos.map((p, idx) => (
                      <img key={idx} src={`http://localhost:5000/${p}`} alt="Restaurant view" className="res-strip-img" />
                    ))}
                  </div>
                )}

                <form onSubmit={(e) => handlePhotosUpload(e, res._id)} className="photos-upload-form flex">
                  <label htmlFor={`upload-photos-${res._id}`} className="btn btn-secondary btn-sm">
                    <FaCamera /> Select Images (Up to 5)
                  </label>
                  <input
                    type="file"
                    id={`upload-photos-${res._id}`}
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                  />
                  {selectedPhotos.length > 0 && (
                    <div className="photo-submit-strip flex gap-2">
                      <span className="count">{selectedPhotos.length} selected</span>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={uploadingPhotos}>
                        {uploadingPhotos ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageRestaurants;
