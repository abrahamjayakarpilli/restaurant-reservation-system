import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FaSun,
  FaMoon,
  FaUtensils,
  FaUser,
  FaCalendarAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChartLine
} from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_URL}/${path}`;
  };

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <FaUtensils className="accent-text" />
          <span className="logo-text title-serif">Table<span className="accent-text">Craft</span></span>
        </Link>

        {/* Hamburger Menu Icon */}
        <div className="navbar-menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Navigation Links */}
        <ul className={`navbar-links ${isOpen ? 'active' : ''}`}>
          <li>
            <Link to="/restaurants" onClick={() => setIsOpen(false)}>Restaurants</Link>
          </li>
          
          {user ? (
            <>
              {isAdmin ? (
                <>
                  <li>
                    <Link to="/admin/dashboard" onClick={() => setIsOpen(false)}>
                      <FaChartLine className="nav-icon" /> Admin Panel
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/my-bookings" onClick={() => setIsOpen(false)}>
                      <FaCalendarAlt className="nav-icon" /> My Bookings
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/profile" className="nav-profile-link" onClick={() => setIsOpen(false)}>
                  {user.profilePicture ? (
                    <img
                      src={getAvatarUrl(user.profilePicture)}
                      alt="Avatar"
                      className="nav-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FaUser className="nav-icon" />
                  )}
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="btn-logout" title="Logout">
                  <FaSignOutAlt />
                  <span className="logout-text">Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="nav-login-link" onClick={() => setIsOpen(false)}>Login</Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-primary" onClick={() => setIsOpen(false)}>Register</Link>
              </li>
            </>
          )}

          {/* Theme Toggle Button */}
          <li>
            <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
              {theme === 'dark' ? <FaSun className="sun-icon" /> : <FaMoon className="moon-icon" />}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
