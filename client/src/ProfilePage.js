import React from 'react';
import { useAuth } from './AuthContext';
import './ProfilePage.css'; // We'll create this next

function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page-container profile-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="page-container profile-container">
      <div className="profile-card">
        <h2 className="profile-title">My Profile</h2>
        <div className="profile-info">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        {/* We can add more details here later, like 'display name' */}
      </div>
    </div>
  );
}

export default ProfilePage;