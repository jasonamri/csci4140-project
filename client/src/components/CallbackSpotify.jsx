import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CallbackSpotify = () => {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const code = new URLSearchParams(window.location.search).get('code');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/spotify/callback?code=${code}`);
        setMessage(response.data.message);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Callback Response</h2>
      {message && (
        <div>
          <p>{message}</p>
          <button onClick={() => navigate("/profile")}>Back to profile</button>
        </div>
      )}
    </div>
  );
};

export default CallbackSpotify;
