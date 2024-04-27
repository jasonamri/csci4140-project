import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/Home.css';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';

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

    const [anchorElUser, setAnchorElUser] = React.useState(null);

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    return (
        <div className='home'>
            <AppBar position="static">
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Box sx={{ flexGrow: 1, display: 'flex' }}>
                        <Button
                            onClick={toggleModal}
                            sx={{ my: 2, pr: 5, color: 'white', display: 'block' }}
                            >
                            Create New Playlist
                        </Button>
                        <Button
                            onClick={() => navigate('/import')}
                            sx={{ my: 2, color: 'white', display: 'block' }}
                            >
                            Import a Playlist
                        </Button>
                        </Box>

                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Open settings">
                                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar/>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                <MenuItem onClick={() => navigate('/profile')}>
                                    <Typography textAlign="center">Profile</Typography>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <Typography textAlign="center">Logout</Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

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
