import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LinkSpotify = () => {
  const [spotifyStatus, setSpotifyStatus] = useState(null);

  useEffect(() => {
    const fetchSpotifyStatus = async () => {
      try {
        const response = await axios.get('/spotify/status');
        setSpotifyStatus(response.data.data.spotify_status);
      } catch (error) {
        console.error('Error fetching Spotify status:', error);
      }
    };

    fetchSpotifyStatus();
  }, []);

  const handleLinkSpotify = async () => {
    try {
      const response = await axios.get('/spotify/link');
      window.location.href = response.data.data.redirect_url;
    } catch (error) {
      console.error('Error linking Spotify:', error);
    }
  };

  const handleUnlinkSpotify = async () => {
    try {
      await axios.post('/spotify/unlink');
      setSpotifyStatus('UNLINKED');
    } catch (error) {
      console.error('Error unlinking Spotify:', error);
    }
  };

  if (spotifyStatus === 'LINKED') {
    return (
      <button onClick={handleUnlinkSpotify}>Unlink Spotify</button>
    );
  } else if (spotifyStatus === 'UNLINKED') {
    return (
      <button onClick={handleLinkSpotify}>Link Spotify</button>
    );
  } else {
    return <div>Loading...</div>;
  }
};

export default LinkSpotify;
