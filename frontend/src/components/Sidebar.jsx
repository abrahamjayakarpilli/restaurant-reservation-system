import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaChartBar,
  FaUtensils,
  FaTh,
  FaClock,
  FaCalendarCheck,
  FaArrowLeft
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <h3 className="title-serif">Admin Menu</h3>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FaChartBar className="sidebar-icon" />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink
          to="/admin/restaurants"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FaUtensils className="sidebar-icon" />
          <span>My Restaurants</span>
        </NavLink>

        <NavLink
          to="/admin/tables"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FaTh className="sidebar-icon" />
          <span>Manage Tables</span>
        </NavLink>

        <NavLink
          to="/admin/slots"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FaClock className="sidebar-icon" />
          <span>Time Slots</span>
        </NavLink>

        <NavLink
          to="/admin/reservations"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FaCalendarCheck className="sidebar-icon" />
          <span>Reservations</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/" className="sidebar-link back-link">
          <FaArrowLeft className="sidebar-icon" />
          <span>Back to Site</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
