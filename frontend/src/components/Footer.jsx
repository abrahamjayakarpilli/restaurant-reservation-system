import React from 'react';
import { FaUtensils, FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand animate-fade">
          <div className="footer-logo">
            <FaUtensils className="accent-text" />
            <span className="logo-text title-serif">Table<span className="accent-text">Craft</span></span>
          </div>
          <p className="footer-desc">
            Crafting premium dining experiences since 2026. Book the finest tables at top-rated culinary spots in just a few clicks.
          </p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
          </div>
        </div>

        <div className="footer-links animate-fade">
          <h4 className="footer-title title-serif">Quick Links</h4>
          <ul>
            <li><a href="/restaurants">Explore Restaurants</a></li>
            <li><a href="/login">Customer Login</a></li>
            <li><a href="/register">Partner Signup</a></li>
          </ul>
        </div>

        <div className="footer-contact animate-fade">
          <h4 className="footer-title title-serif">Get in Touch</h4>
          <ul>
            <li>
              <FaMapMarkerAlt className="accent-text" />
              <span>100 Culinary Way, New York, NY</span>
            </li>
            <li>
              <FaPhone className="accent-text" />
              <span>+1 (800) 555-DINE</span>
            </li>
            <li>
              <FaEnvelope className="accent-text" />
              <span>support@tablecraft.com</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} TableCraft. All rights reserved. Created for premium dining.</p>
      </div>
    </footer>
  );
};

export default Footer;
