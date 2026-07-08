import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUtensils, FaCalendarAlt, FaQrcode, FaStar, FaChevronRight } from 'react-icons/fa';
import api from '../services/api';
import './LandingPage.css';

const LandingPage = () => {
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopRestaurants = async () => {
      try {
        const res = await api.get('/restaurants?sort=-rating&limit=3');
        setTopRestaurants(res.data.data);
      } catch (err) {
        console.error('Failed to fetch top restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRestaurants();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/restaurants');
    }
  };

  const cuisines = [
    { name: 'Italian', icon: '🍕' },
    { name: 'Japanese', icon: '🍣' },
    { name: 'Mexican', icon: '🌮' },
    { name: 'Indian', icon: '🍛' },
    { name: 'French', icon: '🥐' },
    { name: 'American', icon: '🍔' }
  ];

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content container animate-slide">
          <span className="hero-subtitle accent-text uppercase font-bold tracking-wider">Elevate Your Dining</span>
          <h1 className="title-serif">TableCraft</h1>
          <h2 className="title-serif">Exceptional Culinary Journeys, <span className="accent-text">Seamlessly Reserved</span></h2>
          <p>Discover top-rated dining spots, browse rich menu descriptions, and secure your table in seconds. No wait, no hassle.</p>
          
          <form onSubmit={handleSearchSubmit} className="hero-search-bar glass">
            <input
              type="text"
              placeholder="Search by restaurant name, cuisine or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">Find Tables</button>
          </form>
        </div>
      </header>

      {/* Cuisine Quick Selection */}
      <section className="cuisines-section container">
        <h3 className="section-title title-serif text-center">Browse by <span className="accent-text">Cuisine</span></h3>
        <div className="cuisine-grid">
          {cuisines.map((cuisine) => (
            <Link
              to={`/restaurants?cuisine=${cuisine.name}`}
              key={cuisine.name}
              className="cuisine-card glass flex-center"
            >
              <span className="cuisine-icon">{cuisine.icon}</span>
              <span className="cuisine-name">{cuisine.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works-section">
        <div className="container">
          <h3 className="section-title title-serif text-center">How <span className="accent-text">It Works</span></h3>
          <div className="steps-grid">
            <div className="step-card glass text-center">
              <div className="step-icon-wrap flex-center">
                <FaUtensils className="step-icon accent-text" />
              </div>
              <h4 className="title-serif">1. Find Restaurant</h4>
              <p>Explore curated restaurants with detailed menus, location tags, and real rating reviews.</p>
            </div>

            <div className="step-card glass text-center">
              <div className="step-icon-wrap flex-center">
                <FaCalendarAlt className="step-icon accent-text" />
              </div>
              <h4 className="title-serif">2. Reserve Table</h4>
              <p>Select your date, guest count, and choose an available time slot matching capacity.</p>
            </div>

            <div className="step-card glass text-center">
              <div className="step-icon-wrap flex-center">
                <FaQrcode className="step-icon accent-text" />
              </div>
              <h4 className="title-serif">3. Scan & Dine</h4>
              <p>Get a digital booking confirmation and scan your custom QR code at check-in.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="featured-section container">
        <div className="featured-header">
          <h3 className="section-title title-serif">Featured <span className="accent-text">Venues</span></h3>
          <Link to="/restaurants" className="explore-link">
            Explore All Restaurants <FaChevronRight />
          </Link>
        </div>

        {loading ? (
          <div className="grid-responsive">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton" style={{ height: '380px' }}></div>
            ))}
          </div>
        ) : (
          <div className="grid-responsive">
            {topRestaurants.map((restaurant) => (
              <div key={restaurant._id} className="restaurant-card-item glass animate-fade">
                <div className="card-image-placeholder">
                  {restaurant.photos && restaurant.photos[0] ? (
                    <img src={`http://localhost:5000/${restaurant.photos[0]}`} alt={restaurant.name} />
                  ) : (
                    <div className="no-image flex-center">
                      <FaUtensils />
                    </div>
                  )}
                  <span className="card-badge">{restaurant.cuisine[0]}</span>
                </div>
                <div className="card-content">
                  <div className="card-rating">
                    <FaStar className="star-icon" />
                    <span>{restaurant.rating.toFixed(1)} ({restaurant.numReviews} reviews)</span>
                  </div>
                  <h4 className="title-serif">{restaurant.name}</h4>
                  <p className="card-loc">{restaurant.location}</p>
                  <p className="card-desc">{restaurant.description.substring(0, 90)}...</p>
                  <div className="card-footer">
                    <span className="hours">{restaurant.openingHours.open} - {restaurant.openingHours.close}</span>
                    <Link to={`/restaurants/${restaurant._id}`} className="btn btn-primary btn-sm">Reserve</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
