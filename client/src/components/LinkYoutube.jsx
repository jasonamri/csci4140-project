import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LinkYoutube = () => {
  const [youtubeStatus, setYoutubeStatus] = useState(null);

  useEffect(() => {
    const fetchYoutubeStatus = async () => {
      try {
        const response = await axios.get('/youtube/status');
        setYoutubeStatus(response.data.data.youtube_status);
      } catch (error) {
        console.error('Error fetching Youtube status:', error);
      }
    };

    fetchYoutubeStatus();
  }, []);

  const handleLinkYoutube = async () => {
    try {
      const response = await axios.get('/youtube/link');
      window.location.href = response.data.data.redirect_url;
    } catch (error) {
      console.error('Error linking Youtube:', error);
    }
  };

  const handleUnlinkYoutube = async () => {
    try {
      await axios.post('/youtube/unlink');
      setYoutubeStatus('UNLINKED');
    } catch (error) {
      console.error('Error unlinking Youtube:', error);
    }
  };

  if (youtubeStatus === 'LINKED') {
    return (
      <button onClick={handleUnlinkYoutube}>Unlink Youtube</button>
    );
  } else if (youtubeStatus === 'UNLINKED') {
    return (
      <button onClick={handleLinkYoutube}>Link Youtube</button>
    );
  } else {
    return <div>Loading...</div>;
  }
};

export default LinkYoutube;
