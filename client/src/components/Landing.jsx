import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [authStatus, setAuthStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/auth/status');
        setAuthStatus(response.data);
      } catch (error) {
        console.error('Error fetching auth status:', error);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="landing-page">
      <h1>Welcome to Smart Playlist Manager</h1>
      {authStatus.status === 'logged-in' ? (
        <div>
          <p>Hello, {authStatus.username}</p>
          <button onClick={() => navigate('/home')}>Go to Home</button>
        </div>
      ) : (
        <div>
          <button onClick={handleLoginClick}>Login</button>
          <button onClick={handleRegisterClick}>Register</button>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
