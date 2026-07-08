import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import api from '../services/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validations
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      showToast('Logged in successfully', 'success');
      // Redirect based on role
      const savedUser = JSON.parse(localStorage.getItem('token') ? atob(localStorage.getItem('token').split('.')[1]) : '{}');
      // We check our updated context or state to see what the role is
      api.get('/auth/me').then(res => {
        if (res.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/restaurants');
        }
      }).catch(() => navigate('/'));
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast('Please enter your email in the field to request a reset link', 'warning');
      return;
    }
    try {
      const res = await api.post('/auth/forgotpassword', { email });
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request reset.', 'error');
    }
  };

  return (
    <div className="login-container flex-center">
      <div className="login-card glass animate-slide">
        <div className="login-header">
          <h2 className="title-serif">Welcome Back</h2>
          <p>Login to reserve your next exquisite table experience</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="forgot-password-link">
            <button type="button" onClick={handleForgotPassword} className="btn-link">
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <div className="spinner"></div> : <><FaSignInAlt /> Login</>}
          </button>
        </form>

        <div className="login-footer">
          <p>New to TableCraft? <Link to="/register" className="accent-text font-bold">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
