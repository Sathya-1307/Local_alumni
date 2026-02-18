import React from 'react';
import { useNavigate } from 'react-router-dom';

const MentorshipDashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Mentorship Dashboard</h1>
      <p>Mentorship management features coming soon...</p>
      <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Back to Home
      </button>
    </div>
  );
};

export default MentorshipDashboard;
