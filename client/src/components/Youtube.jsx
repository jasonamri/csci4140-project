import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlaylistComponent = () => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get('/youtube/get-all-pls');
        setPlaylists(response.data.data.playlists);
        console.log(response.data.data.playlists);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };

    fetchPlaylists();
  }, []);

  return (
    <div>
      <h2>Playlists</h2>
      <ul>
        {playlists.map((playlist, index) => (
          <li key={index}>{playlist.snippet.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default PlaylistComponent;
