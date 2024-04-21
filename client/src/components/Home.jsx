import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [playlists, setPlaylists] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const fetchPlaylists = async () => {
        const response = await axios.get('/pl/get-all');
        const playlists = response.data.data.playlists;
        setPlaylists(playlists);
    }

    // Fetch playlists on component mount
    useEffect(() => {
        fetchPlaylists();
    }, []);

    // Handle logout
    const handleLogout = async () => {
        const response = await axios.get('/auth/logout');
        if (response.data.status === 'success') {
            navigate('/login');
        } else {
            alert('Error logging out: ' + response.data.message || 'An error occurred');
        }
    };

    const createPlaylist = async () => {
        setShowModal(!showModal);

        const playlistName = document.querySelector('input').value;
        
        // Create a new playlist
        const response = await axios.post('/pl/create', {
            name: playlistName,
            creation_type: 'BLANK',
            songs: []
        });
        if (response.data.status === 'success') {
            alert('Playlist created successfully');
            fetchPlaylists();
        } else {
            alert('Error creating playlist: ' + response.data.message || 'An error occurred');
        }
    }

    // Toggle the new playlist modal
    const toggleModal = () => {
        setShowModal(!showModal);
    };

    const openPlaylist = (pl_id) => {
        navigate('/playlist?pl_id=' + pl_id);
    }

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f5f5f5' }}>
                <button onClick={toggleModal}>Create New Playlist</button>
                <button onClick={() => navigate('/import')}>Import a Playlist</button>
                <button onClick={() => navigate('/profile')}>Profile</button>
                <button onClick={handleLogout}>Logout</button>
            </header>

            {showModal && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
                    <h2>Create New Playlist</h2>
                    <input type="text" placeholder="Playlist Name" /><br />
                    <button onClick={createPlaylist}>Create</button>
                    <button onClick={toggleModal}>Close</button>
                </div>
            )}

            <div style={{ padding: '20px' }}>
                <h2>Playlists</h2>
                <table border="1">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Privacy</th>
                            <th>Songs Count</th>
                            <th>Spotify Status</th>
                            <th>YouTube Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {playlists.map(playlist => (
                            <tr key={playlist.pl_id}>
                                <td>{playlist.name}</td>
                                <td>{playlist.privacy}</td>
                                <td>{playlist.songs.length}</td>
                                <td>{playlist.spotify_status}</td>
                                <td>{playlist.youtube_status}</td>
                                <td>
                                    <button onClick={() => openPlaylist(playlist.pl_id)}>Open</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Home;
