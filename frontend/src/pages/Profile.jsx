import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaUser, FaLock, FaCamera, FaEnvelope, FaPhone } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, uploadAvatar, changePassword } = useAuth();
  const { showToast } = useToast();

  // Profile details state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Upload avatar state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_URL}/${path}`;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setUpdatingProfile(true);
    const result = await updateProfile(name, email, phone);
    setUpdatingProfile(false);

    if (result.success) {
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a file first', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    setUploadingAvatar(true);
    const result = await uploadAvatar(formData);
    setUploadingAvatar(false);

    if (result.success) {
      showToast('Profile picture uploaded successfully!', 'success');
      setSelectedFile(null);
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'warning');
      return;
    }

    setUpdatingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setUpdatingPassword(false);

    if (result.success) {
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(result.message, 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page container animate-fade">
      <div className="profile-header">
        <h2 className="title-serif">Profile & <span className="accent-text">Settings</span></h2>
        <p>Manage your account credentials, avatar picture, and profile details</p>
      </div>

      <div className="profile-grid-layout">
        {/* Left Card: Avatar and Summary */}
        <div className="summary-column">
          <div className="summary-card glass text-center">
            <div className="avatar-wrapper flex-center">
              {user.profilePicture ? (
                <img src={getAvatarUrl(user.profilePicture)} alt="Profile Avatar" className="profile-avatar-img" />
              ) : (
                <div className="avatar-placeholder flex-center"><FaUser /></div>
              )}
            </div>
            <h3 className="title-serif">{user.name}</h3>
            <span className="user-role-badge">{user.role}</span>
            <p className="user-email-text">{user.email}</p>

            {/* Avatar Upload Form */}
            <form onSubmit={handleAvatarUpload} className="avatar-upload-form">
              <label htmlFor="avatar-file" className="btn btn-secondary btn-sm select-btn">
                <FaCamera /> Select New Photo
              </label>
              <input
                type="file"
                id="avatar-file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {selectedFile && (
                <div className="file-submit-wrap animate-fade">
                  <span className="selected-filename">{selectedFile.name.substring(0, 15)}...</span>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={uploadingAvatar}>
                    {uploadingAvatar ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Columns: Edit Forms */}
        <div className="forms-column">
          {/* Edit Profile Form */}
          <div className="settings-card glass">
            <h3 className="title-serif section-subtitle"><FaUser /> Edit Profile Details</h3>
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email"><FaEnvelope /> Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone"><FaPhone /> Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="settings-card glass">
            <h3 className="title-serif section-subtitle"><FaLock /> Security & Password</h3>
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="form-group">
                <label className="form-label" htmlFor="current-pw">Current Password</label>
                <input
                  type="password"
                  id="current-pw"
                  className="form-control"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-pw">New Password</label>
                <input
                  type="password"
                  id="new-pw"
                  className="form-control"
                  placeholder="•••••••• (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-pw">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm-pw"
                  className="form-control"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={updatingPassword}>
                {updatingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
