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
  TableContainer,
  Table,
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Paper,
  TablePagination,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
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

      <div style={{ marginLeft: '20px', marginTop: '20px', marginRight: '20px' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{playlist.owner} has shared the following playlist with you!</Typography>
        <Button variant="contained" size="small" onClick={createPlaylist} sx={{ mt: '10px' }}>Add to my library</Button>

        <Stack sx={{ mt: '20px' }} spacing={1}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Playlist: {playlist.name}</Typography>
          <Typography variant="subtitle1">Songs Count: {songs.length}</Typography>
          <Typography variant="subtitle1">Spotify Status: {playlist.spotify_status}</Typography>
          <Typography variant="subtitle1">YouTube Status: {playlist.youtube_status}</Typography>
          <Typography variant="subtitle1">Privacy: {playlist.privacy}</Typography>
        </Stack>

        <Typography variant="h5" sx={{ mt: '20px', mb: '15px', fontWeight: 'bold' }}>Songs</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Artist</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {songs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(song => (
                <TableRow key={song.id}>
                  <TableCell>{song.title}</TableCell>
                  <TableCell>{song.artist}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[25, 50, 100]}
            component="div"
            count={songs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </div>
    </div>
  );
}

export default Playlist;
