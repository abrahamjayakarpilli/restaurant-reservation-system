import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaUtensils, FaSearch, FaStar, FaMapMarkerAlt, FaFilter } from 'react-icons/fa';
import api from '../services/api';
import './Restaurants.jsx'; // self reference or style reference? Stylesheet is Restaurants.css
import './Restaurants.css';

const Restaurants = () => {
  const location = useLocation();

  // Search, filter, and sort state
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Available locations and cuisines for filter lists
  const availableCuisines = ['Italian', 'Japanese', 'Mexican', 'Indian', 'French', 'American', 'Chinese', 'Thai', 'Mediterranean', 'Spanish'];
  const availableLocations = [
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

  // Initialize filters from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const cuisineParam = params.get('cuisine');
    const locationParam = params.get('location');

    if (searchParam) setSearchTerm(searchParam);
    if (cuisineParam) setSelectedCuisine(cuisineParam);
    if (locationParam) setSelectedLocation(locationParam);
  }, [location.search]);

  // Fetch restaurants callback
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        sort: sortBy
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCuisine) params.cuisine = selectedCuisine;
      if (selectedLocation) params.location = selectedLocation;
      if (minRating) params.rating = minRating;

      const res = await api.get('/restaurants', { params });
      setRestaurants(res.data.data);
      setTotalResults(res.data.total);
      setTotalPages(Math.ceil(res.data.total / 8));
    } catch (err) {
      console.error('Error loading restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCuisine, selectedLocation, minRating, sortBy]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCuisine('');
    setSelectedLocation('');
    setMinRating('');
    setSortBy('-createdAt');
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRestaurants();
  };

  return (
    <div className="restaurants-page container">
      {/* Search Header */}
      <div className="search-header animate-slide">
        <h2 className="title-serif">Find Your <span className="accent-text">Perfect Table</span></h2>
        <form onSubmit={handleSearchSubmit} className="search-form glass">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by restaurant name, specialty, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      <div className="restaurants-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar glass animate-slide">
          <div className="sidebar-title flex-between">
            <h3 className="flex-center gap-2"><FaFilter /> Filters</h3>
            <button onClick={handleClearFilters} className="clear-btn">Clear All</button>
          </div>

          <div className="filter-group">
            <label className="form-label">Cuisine Type</label>
            <select
              value={selectedCuisine}
              onChange={(e) => { setSelectedCuisine(e.target.value); setPage(1); }}
              className="form-control"
            >
              <option value="">All Cuisines</option>
              {availableCuisines.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="form-label">Location / City</label>
            <select
              value={selectedLocation}
              onChange={(e) => { setSelectedLocation(e.target.value); setPage(1); }}
              className="form-control"
            >
              <option value="">All Locations</option>
              {availableLocations.map((l) => (
                <option key={l} value={l}>{l.split(',')[0]}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="form-label">Minimum Rating</label>
            <select
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
              className="form-control"
            >
              <option value="">Any Rating</option>
              <option value="4.5">★ 4.5 & Above</option>
              <option value="4.0">★ 4.0 & Above</option>
              <option value="3.5">★ 3.5 & Above</option>
              <option value="3.0">★ 3.0 & Above</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="form-label">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="form-control"
            >
              <option value="-createdAt">Newest Venues</option>
              <option value="-rating">Top Rated</option>
              <option value="name">Alphabetical (A-Z)</option>
              <option value="-numReviews">Most Popular</option>
            </select>
          </div>
        </aside>

        {/* Results Content */}
        <main className="results-container">
          <div className="results-count">
            <p>{loading ? 'Searching...' : `${totalResults} restaurants match your criteria`}</p>
          </div>

          {loading ? (
            <div className="grid-responsive">
              {[1, 2, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="skeleton" style={{ height: '360px' }}></div>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="empty-state glass flex-center">
              <FaUtensils className="empty-icon" />
              <h3>No Restaurants Found</h3>
              <p>We couldn't find any dining spots matching your filter criteria. Try expanding your search options.</p>
              <button onClick={handleClearFilters} className="btn btn-primary">Reset Filters</button>
            </div>
          ) : (
            <>
              <div className="grid-responsive animate-fade">
                {restaurants.map((restaurant) => (
                  <div key={restaurant._id} className="restaurant-card glass">
                    <div className="card-image">
                      {restaurant.photos && restaurant.photos[0] ? (
                        <img src={`http://localhost:5000/${restaurant.photos[0]}`} alt={restaurant.name} />
                      ) : (
                        <div className="no-image flex-center">
                          <FaUtensils />
                        </div>
                      )}
                      <span className="card-badge">{restaurant.cuisine[0]}</span>
                    </div>
                    <div className="card-body">
                      <div className="card-rating">
                        <FaStar className="star-icon" />
                        <span>{restaurant.rating.toFixed(1)} ({restaurant.numReviews} reviews)</span>
                      </div>
                      <h3 className="title-serif">{restaurant.name}</h3>
                      <p className="card-location">
                        <FaMapMarkerAlt /> {restaurant.location}
                      </p>
                      <p className="card-desc-full">{restaurant.description.substring(0, 100)}...</p>
                      <div className="card-footer-buttons">
                        <span className="timing">{restaurant.openingHours.open} - {restaurant.openingHours.close}</span>
                        <Link to={`/restaurants/${restaurant._id}`} className="btn btn-primary btn-sm">Details & Book</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container flex-center">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Prev
                  </button>
                  <span className="page-indicator">Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Restaurants;
