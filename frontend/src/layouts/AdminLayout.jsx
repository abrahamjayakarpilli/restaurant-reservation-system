import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Navbar />
      <div className="admin-layout-container">
        <Sidebar />
        <main className="admin-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
