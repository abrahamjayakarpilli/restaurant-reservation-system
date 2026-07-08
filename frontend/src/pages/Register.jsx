import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaUserPlus } from 'react-icons/fa';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, phone, role } = formData;

    // Client-side validations
    if (!name || !email || !password || !phone) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    // Phone validation regex
    const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
    if (!phoneRegex.test(phone)) {
      showToast('Please enter a valid phone number', 'warning');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password, phone, role);
    setLoading(false);

    if (result.success) {
      showToast('Account registered successfully', 'success');
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/restaurants');
      }
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="register-container flex-center">
      <div className="register-card glass animate-slide">
        <div className="register-header">
          <h2 className="title-serif">Create Account</h2>
          <p>Sign up to lock in your next dining reservation</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <div className="input-with-icon">
              <FaPhone className="input-icon" />
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-control"
                placeholder="123-456-7890"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="•••••••• (min 6 chars)"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Account Type</label>
            <select
              id="role"
              name="role"
              className="form-control"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="customer">Customer (Book Tables)</option>
              <option value="admin">Restaurant Admin (Manage Restaurants)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <div className="spinner"></div> : <><FaUserPlus /> Register</>}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login" className="accent-text font-bold">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
