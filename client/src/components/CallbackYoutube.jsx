import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CallbackYoutube = () => {
  const [message, setMessage] = useState('');

  const code = new URLSearchParams(window.location.search).get('code');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/youtube/callback?code=${code}`);
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
      <p>{message}</p>
    </div>
  );
};

export default CallbackYoutube;
