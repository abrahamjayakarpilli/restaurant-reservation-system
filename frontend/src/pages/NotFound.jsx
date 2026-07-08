import React from 'react';
import { Link } from 'react-router-dom';
import { FaUtensils, FaArrowLeft } from 'react-icons/fa';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="notfound-container flex-center">
      <div className="notfound-card glass animate-slide flex-center">
        <FaUtensils className="notfound-icon accent-text" />
        <h1 className="title-serif">404</h1>
        <h2>Table Not Found</h2>
        <p>The page you are looking for has been cleared, or it never existed in our menu.</p>
        <Link to="/" className="btn btn-primary">
          <FaArrowLeft /> Back to Main Site
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
