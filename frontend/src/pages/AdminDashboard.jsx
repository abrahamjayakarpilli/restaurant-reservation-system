import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import {
  FaCalendarCheck,
  FaCalendarDay,
  FaCalendarAlt,
  FaDollarSign,
  FaClock,
  FaUsers
} from 'react-icons/fa';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resAnalytics, resBookings] = await Promise.all([
          api.get('/reservations/analytics'),
          api.get('/reservations/admin-bookings')
        ]);
        setAnalytics(resAnalytics.data.analytics);
        // Show top 5 recent bookings
        setRecentBookings(resBookings.data.data.slice(0, 5));
      } catch (err) {
        showToast('Failed to load dashboard statistics.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Reservations',
      value: analytics?.totalReservations || 0,
      icon: <FaCalendarCheck />,
      color: 'info'
    },
    {
      title: "Today's Bookings",
      value: analytics?.todayReservations || 0,
      icon: <FaCalendarDay />,
      color: 'warning'
    },
    {
      title: 'Monthly Bookings',
      value: analytics?.monthlyReservations || 0,
      icon: <FaCalendarAlt />,
      color: 'success'
    },
    {
      title: 'Estimated Revenue',
      value: `$${analytics?.revenue || 0}`,
      icon: <FaDollarSign />,
      color: 'gold'
    }
  ];

  return (
    <div className="admin-dashboard-page animate-fade">
      <div className="dashboard-title-bar">
        <h2 className="title-serif">Dashboard <span className="accent-text">Analytics</span></h2>
        <p>Operational statistics, revenue tracking, and popular reservation schedules</p>
      </div>

      {/* Grid Stats */}
      <section className="dashboard-stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-box glass">
            <div className={`icon-wrapper ${stat.color} flex-center`}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.title}</span>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </section>

      <div className="dashboard-details-layout">
        {/* Popular Slots */}
        <div className="details-panel glass">
          <h3 className="title-serif panel-title"><FaClock /> Popular Time Slots</h3>
          {analytics?.popularSlots && analytics.popularSlots.length > 0 ? (
            <div className="slots-list">
              {analytics.popularSlots.map((slot, index) => (
                <div key={index} className="slot-row flex-between">
                  <span className="slot-time font-bold">{slot.slot}</span>
                  <span className="slot-count badge">{slot.bookings} Bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-msg">No popular slots logged yet.</p>
          )}
        </div>

        {/* Recent Reservations */}
        <div className="details-panel glass flex-grow">
          <h3 className="title-serif panel-title"><FaCalendarCheck /> Recent Reservation Requests</h3>
          <div className="table-responsive">
            {recentBookings.length === 0 ? (
              <p className="no-data-msg">No bookings registered yet.</p>
            ) : (
              <table className="recent-bookings-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Guests</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <div className="cust-info">
                          <span className="name">{b.customerId?.name || 'Guest'}</span>
                          <span className="phone">{b.customerId?.phone}</span>
                        </div>
                      </td>
                      <td>{b.restaurantId?.name}</td>
                      <td>{new Date(b.date).toLocaleDateString()}</td>
                      <td>{b.startTime}</td>
                      <td>
                        <span className="flex-center gap-1"><FaUsers /> {b.guestCount}</span>
                      </td>
                      <td>
                        <span className={`status-badge-inline ${b.status}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
