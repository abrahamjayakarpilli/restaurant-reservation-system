import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FaUtensils,
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaTrashAlt,
  FaEdit,
  FaPlus
} from 'react-icons/fa';
import api from '../services/api';
import './RestaurantDetails.css';

const RestaurantDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Editing review state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const fetchRestaurantDetails = useCallback(async () => {
    try {
      const res = await api.get(`/restaurants/${id}`);
      setRestaurant(res.data.data.restaurant);
    } catch (err) {
      console.error(err);
      showToast('Restaurant details could not be loaded.', 'error');
      navigate('/restaurants');
    }
  }, [id, navigate, showToast]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get(`/restaurants/${id}/reviews`);
      setReviews(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchRestaurantDetails(), fetchReviews()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchRestaurantDetails, fetchReviews]);

  // Check if user already reviewed
  const userReview = user ? reviews.find((r) => r.customerId?._id === user.id || r.customerId === user.id) : null;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to submit a review', 'warning');
      navigate('/login');
      return;
    }

    if (!comment.trim()) {
      showToast('Please write a review comment', 'warning');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/restaurants/${id}/reviews`, { rating, comment });
      showToast('Review submitted successfully!', 'success');
      setComment('');
      setRating(5);
      // Reload reviews & restaurant rating
      await Promise.all([fetchRestaurantDetails(), fetchReviews()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      showToast('Review deleted successfully', 'success');
      await Promise.all([fetchRestaurantDetails(), fetchReviews()]);
    } catch (err) {
      showToast('Failed to delete review.', 'error');
    }
  };

  const handleReviewEditStart = (review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleReviewEditCancel = () => {
    setEditingReviewId(null);
    setEditComment('');
  };

  const handleReviewEditSubmit = async (e, reviewId) => {
    e.preventDefault();
    if (!editComment.trim()) {
      showToast('Review comment cannot be empty', 'warning');
      return;
    }
    try {
      await api.put(`/reviews/${reviewId}`, { rating: editRating, comment: editComment });
      showToast('Review updated successfully!', 'success');
      setEditingReviewId(null);
      await Promise.all([fetchRestaurantDetails(), fetchReviews()]);
    } catch (err) {
      showToast('Failed to update review.', 'error');
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

  return (
    <div className="restaurant-details-page container animate-slide">
      {/* Restaurant Title Section */}
      <div className="restaurant-header-block glass">
        <div className="header-info">
          <span className="cuisine-tags">
            {restaurant.cuisine.map((c) => (
              <span key={c} className="tag">{c}</span>
            ))}
          </span>
          <h1 className="title-serif">{restaurant.name}</h1>
          <div className="rating-summary">
            <FaStar className="star-icon" />
            <span className="score">{restaurant.rating.toFixed(1)}</span>
            <span className="count">({restaurant.numReviews} reviews)</span>
          </div>

          <div className="contact-grid">
            <p><FaMapMarkerAlt className="accent-text" /> {restaurant.address}, {restaurant.location}</p>
            <p><FaPhone className="accent-text" /> {restaurant.contactDetails.phone}</p>
            <p><FaEnvelope className="accent-text" /> {restaurant.contactDetails.email}</p>
            <p><FaClock className="accent-text" /> Open Hours: {restaurant.openingHours.open} - {restaurant.openingHours.close}</p>
          </div>
        </div>

        <div className="header-action flex-center">
          <Link to={`/restaurants/${restaurant._id}/book`} className="btn btn-primary btn-book-large">
            <FaCalendarAlt /> Book Table Now
          </Link>
        </div>
      </div>

      <div className="restaurant-body-layout">
        {/* Main Details and Photos */}
        <div className="details-main">
          <div className="details-card glass">
            <h3 className="title-serif card-title">About the Venue</h3>
            <p className="description-text">{restaurant.description}</p>
          </div>

          {/* Reviews Section */}
          <div className="reviews-card glass">
            <h3 className="title-serif card-title">Customer Reviews</h3>
            
            {/* Show Add Review Form */}
            {user && user.role === 'customer' && !userReview && (
              <form onSubmit={handleReviewSubmit} className="add-review-form">
                <h4>Leave a Review</h4>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <div className="star-rating-selector">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        type="button"
                        key={stars}
                        onClick={() => setRating(stars)}
                        className={`star-selector-btn ${stars <= rating ? 'active' : ''}`}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="comment">Comment</label>
                  <textarea
                    id="comment"
                    rows="3"
                    className="form-control"
                    placeholder="Share your dining experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                  {submittingReview ? <div className="spinner"></div> : <><FaPlus /> Submit Review</>}
                </button>
              </form>
            )}

            {/* List Reviews */}
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p className="no-reviews-msg">No reviews yet. Be the first to share your experience!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="review-item">
                    {editingReviewId === rev._id ? (
                      // Edit Mode
                      <form onSubmit={(e) => handleReviewEditSubmit(e, rev._id)} className="edit-review-form">
                        <div className="star-rating-selector">
                          {[1, 2, 3, 4, 5].map((stars) => (
                            <button
                              type="button"
                              key={stars}
                              onClick={() => setEditRating(stars)}
                              className={`star-selector-btn ${stars <= editRating ? 'active' : ''}`}
                            >
                              <FaStar />
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows="2"
                          className="form-control my-2"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          required
                        ></textarea>
                        <div className="flex gap-2">
                          <button type="submit" className="btn btn-primary btn-sm">Save</button>
                          <button type="button" onClick={handleReviewEditCancel} className="btn btn-secondary btn-sm">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      // Normal Mode
                      <>
                        <div className="review-header flex-between">
                          <div className="reviewer-info">
                            <span className="reviewer-name font-bold">{rev.customerId?.name || 'Guest User'}</span>
                            <span className="review-date">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="review-stars flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar key={star} className={star <= rev.rating ? 'star-icon-filled' : 'star-icon-empty'} />
                            ))}
                          </div>
                        </div>
                        <p className="review-comment">{rev.comment}</p>
                        
                        {/* Edit/Delete controls for owner */}
                        {user && (rev.customerId?._id === user.id || rev.customerId === user.id) && (
                          <div className="review-controls flex gap-2">
                            <button onClick={() => handleReviewEditStart(rev)} className="control-btn edit">
                              <FaEdit /> Edit
                            </button>
                            <button onClick={() => handleReviewDelete(rev._id)} className="control-btn delete">
                              <FaTrashAlt /> Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <aside className="details-sidebar">
          <div className="sidebar-card glass">
            <h4 className="title-serif">Opening Info</h4>
            <div className="info-item">
              <span className="label">Mon - Sun</span>
              <span className="value">{restaurant.openingHours.open} - {restaurant.openingHours.close}</span>
            </div>
            <div className="info-item">
              <span className="label">Cuisines</span>
              <span className="value">{restaurant.cuisine.join(', ')}</span>
            </div>
            <div className="info-item">
              <span className="label">Location</span>
              <span className="value">{restaurant.location}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RestaurantDetails;
