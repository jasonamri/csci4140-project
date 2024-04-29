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
  TextField,
  Alert,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Profile = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');

  const navigate = useNavigate();

  const handleChangePassword = async e => {
      e.preventDefault();

      try {
          const response = await axios.post('/auth/change-password', {
              currentPassword,
              newPassword,
          });
          setPasswordChangeMessage(response.data.message);
      } catch (error) {
          setPasswordChangeMessage('An error occurred while changing password.');
      }
  };

  const [newEmail, setNewEmail] = useState('');
  const [emailChangeMessage, setEmailChangeMessage] = useState('');

  const handleChangeEmail = async e => {
      e.preventDefault();

      try {
          const response = await axios.post('/auth/change-email', {
              newEmail,
          });
          setEmailChangeMessage(response.data.message);
      } catch (error) {
          setEmailChangeMessage('An error occurred while changing email.');
      }
  };
  
  const [spotifyStatus, setSpotifyStatus] = useState(null);
  const [youtubeStatus, setYoutubeStatus] = useState(null);

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
      await axios.get('/spotify/unlink');
      setSpotifyStatus('UNLINKED');
    } catch (error) {
      console.error('Error unlinking Spotify:', error);
    }
  };

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
      await axios.get('/youtube/unlink');
      setYoutubeStatus('UNLINKED');
    } catch (error) {
      console.error('Error unlinking Youtube:', error);
    }
  };

  const renderSpotifyLink = () => {
    if (spotifyStatus === 'LINKED') {
      return (
        <><Button variant="contained" onClick={handleUnlinkSpotify} sx={{ ml: '20px' }}>Unlink Spotify</Button></>
      );
    } else if (spotifyStatus === 'UNLINKED') {
      return (
        <><Button variant="contained" onClick={handleLinkSpotify} sx={{ ml: '20px' }}>Link Spotify</Button></>
      );
    } else {
      return <><Button variant="contained" sx={{ ml: '20px' }}>Loading...</Button></>;
    }
  }

  const renderYoutubeLink = () => {
    if (youtubeStatus === 'LINKED') {
      return (
        <><Button variant="contained" onClick={handleUnlinkYoutube} sx={{ ml: '20px' }}>Unlink Youtube</Button></>
      );
    } else if (youtubeStatus === 'UNLINKED') {
      return (
        <><Button variant="contained" onClick={handleLinkYoutube} sx={{ ml: '20px' }}>Link Youtube</Button></>
      );
    } else {
      return <><Button variant="contained" sx={{ ml: '20px' }}>Loading...</Button></>;
    }
  }

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
    <div className='profile'>
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
                <MenuItem onClick={handleLogout}>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Stack direction="row" spacing={2}>
        <div>
          <Typography variant='h5' sx={{ mt: '20px', ml: '20px', mb: '15px' }}>Change Password</Typography>
          <form onSubmit={handleChangePassword}>
            <TextField type="password" value={currentPassword} label="Current Password" variant="filled" size="small" onChange={(e) => setCurrentPassword(e.target.value)}
              sx={{ ml: '20px', width: '250px' }} />
            <br />
            <TextField type="password" value={newPassword} label="New Password" variant="filled" size="small" onChange={(e) => setNewPassword(e.target.value)}
              sx={{ ml: '20px', mt: '20px', width: '250px' }} />
            <br />
            <Button variant="contained" type="submit" sx={{ mt: "20px", ml: '20px' }}>Change Password</Button>
          </form>
          <p>{passwordChangeMessage && <Alert severity="info" sx={{ ml: '20px', width: '200px' }}>{passwordChangeMessage}</Alert>}</p>
        </div>
        <div>
          <Typography variant='h5' sx={{ mt: '20px', ml: '50px', mb: '15px' }}>Change Email</Typography>
          <form onSubmit={handleChangeEmail}>
            <TextField type="email" value={newEmail} label="New Email" variant="filled" size="small" onChange={(e) => setNewEmail(e.target.value)}
                sx={{ ml: '50px', width: '300px' }} />
              <br />
              <Button variant="contained" type="submit" sx={{ mt: "20px", ml: '50px' }}>Change Email</Button>
          </form>
          <p>{emailChangeMessage && <Alert severity="info" sx={{ ml: '50px', width: '250px' }}>{emailChangeMessage}</Alert>}</p>
        </div>
      </Stack>

      <Typography variant='h5' sx={{ mt: '20px', ml: '20px', mb: '15px' }}>Manage Spotify Integration</Typography>
      {renderSpotifyLink()}

      <Typography variant='h5' sx={{ mt: '40px', ml: '20px', mb: '15px' }}>Manage Youtube Integration</Typography>
      {renderYoutubeLink()}
    </div>
  );
};

export default Profile;
