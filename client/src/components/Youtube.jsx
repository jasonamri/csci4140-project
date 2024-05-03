import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  List,
  ListItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

  const navigate = useNavigate();

  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    const response = await axios.get('/auth/logout');
    if (response.data.status === 'success') {
      navigate('/login');
    } else {
      alert('Error logging out: ' + response.data.message || 'An error occurred');
    }
  };

  return (
    <div>
      <AppBar position="static" sx={{ height: '70px' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              <Tooltip title="Back to home">
                <Button
                  onClick={() => navigate('/home')}
                  sx={{ color: 'white', ml: '-20px' }}
                >
                  <ArrowBackIcon></ArrowBackIcon>
                </Button>
              </Tooltip>
            </Box>

            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar />
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

      <Typography variant="h5" sx={{ mt: '20px', ml: '20px' }}>YouTube Playlists</Typography>
      <List sx={{ ml: '20px', listStyleType: 'disc', pl: 3 }}>
        {playlists.map((playlist, index) => (
          <ListItem key={index} sx={{ display: 'list-item', padding: 0 }}>
            <Typography variant="subtitle1">{playlist.snippet.title}</Typography>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default PlaylistComponent;
