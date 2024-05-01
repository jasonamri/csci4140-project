import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Playlist() {
  const [playlist, setPlaylist] = useState({});
  const [songs, setSongs] = useState([]);
  const navigate = useNavigate();

  const pl_id = new URLSearchParams(window.location.search).get('pl_id');

  const fetchPlaylist = async () => {
    const response = await axios.get('/pl/get/' + pl_id);
    if (response.data.status !== 'success') {
      alert('Error fetching playlist: ' + response.data.message || 'An error occurred');
      return;
    }
    const playlist = response.data.data.playlist;
    setPlaylist(playlist);
  }

  const fetchSongs = async () => {
    const response = await axios.get('/pl/get-songs/' + pl_id);
    if (response.data.status !== 'success') {
      alert('Error fetching songs: ' + response.data.message || 'An error occurred');
      return;
    }
    const songs = response.data.data.songs;
    setSongs(songs);
  }

  // Fetch songs on component mount
  useEffect(() => {
    fetchPlaylist();
    fetchSongs();
  }, []);

  const createPlaylist = async () => {
    // Create a new playlist
    const response = await axios.post('/pl/create', {
      name: playlist.name + ' (Shared by ' + playlist.owner + ')',
      creation_type: 'SHARED',
      songs: playlist.songs,
    });
    if (response.data.status === 'success') {
      alert('Playlist created successfully');
      navigate('/playlist?pl_id=' + response.data.data.playlist.pl_id)
    } else {
      alert('Error creating playlist: ' + response.data.message || 'An error occurred');
    }
  }

  return (
    <div>
      <div style={{ padding: '20px' }}>
        <div>
            <button onClick={() => navigate('/home')}>Back to Home</button>
            <p>{playlist.owner} has shared the following playlist with you!</p>
            <button onClick={createPlaylist}>Add to my library</button>
        </div>
        <div>
          <h2>Playlist: {playlist.name}</h2>
          <p>Songs Count: {songs.length}</p>
          <p>Spotify Status: {playlist.spotify_status}</p>
          <p>YouTube Status: {playlist.youtube_status}</p>
          <p>Privacy: {playlist.privacy}</p>
         </div>
        <h3>Songs</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
            </tr>
          </thead>
          <tbody>
            {songs.map(song => (
              <tr key={song.song_id}>
                <td>{song.title}</td>
                <td>{song.artist}</td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Playlist;
