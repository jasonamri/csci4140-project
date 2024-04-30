import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/Home.css';
import PropTypes from 'prop-types';
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
  Stack,
  alpha,
  Modal
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid } from '@mui/x-data-grid';

function Home() {
  const [playlists, setPlaylists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const navigate = useNavigate();

  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [playlistRows, setPlaylistRows] = useState([]);

  const fetchPlaylists = async () => {
    const response = await axios.get('/pl/get-all');
    const playlists = response.data.data.playlists;
    setPlaylists(playlists);

    const rows = [];
    for (const playlist of playlists) {
      const row = {
        id: playlist.pl_id,
        name: playlist.name,
        privacy: playlist.privacy,
        songs: playlist.songs.length,
        spotify_status: playlist.spotify_status,
        youtube_status: playlist.youtube_status,
        spotify_ref: playlist.spotify_ref,
        youtube_ref: playlist.youtube_ref,
      };
      rows.push(row);
    }
    setPlaylistRows(rows);
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

    // Create a new playlist
    const response = await axios.post('/pl/create', {
      name: newPlaylistName,
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

  const deletePlaylists = async () => {
    for (const pl_id of selectedPlaylists) {
      const response = await axios.delete(`/pl/delete/${pl_id}`);
      if (response.data.status === 'success') {
        alert('Playlist deleted successfully');
        fetchPlaylists();
      } else {
        alert('Error deleting playlist: ' + response.data.message || 'An error occurred');
      }
    }
  }

  const ensurePushable = async (pl_id, platform) => {
    const response = await axios.get(`/pl/get-songs/${pl_id}`);
    const songs = response.data.data.songs;

    for (const song of songs) {
      if (song[`${platform}_status`] !== 'HARD_MATCH') {
        alert('Please HARD_MATCH all songs before pushing');
        return false;
      }
    }
    return songs;
  }

  const pushPlaylist = async (pl_id, platform, platform_ref = null) => {
    const pushableSongs = await ensurePushable(pl_id, platform);
    if (!pushableSongs) return;

    // push playlist locally
    const pushResponse = await axios.post(`/pl/push/${pl_id}`, { platform: platform, platform_ref: platform_ref });
    const playlist = pushResponse.data.data.playlist;

    // push playlist to platform
    const platformPushResponse = await axios.post(`/${platform}/push`, { platform_ref: playlist[`${platform}_ref`], songs: pushableSongs });
    alert('Playlist pushed successfully')

    // update link statuses
    fetchPlaylists();
  }

  const exportPlaylist = async (pl_id, platform, playlist_name) => {
    const pushableSongs = await ensurePushable(pl_id, platform);
    if (!pushableSongs) return;

    // create playlist
    const createResponse = await axios.post(`/${platform}/create-pl`, { name: playlist_name });
    const createdPlaylist = createResponse.data.data.playlist;

    // push playlist
    pushPlaylist(pl_id, platform, createdPlaylist[`${platform}_ref`])
  }

  // Toggle the new playlist modal
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const openPlaylist = (pl_id) => {
    navigate('/playlist?pl_id=' + pl_id);
  }

  const pullPlaylist = async (pl_id, platform, platform_ref) => {
    navigate('/import?pl_id=' + pl_id + '&platform=' + platform + '&platform_ref=' + platform_ref)
  }

  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  function EnhancedTableToolbar(props) {
    const { numSelected } = props;

    return (
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(numSelected > 0 && {
            bgcolor: (theme) =>
              alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
          }),
        }}
      >
        {numSelected > 0 ? (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
        ) : (
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            Playlists
          </Typography>
        )}

        {numSelected > 0 && (
          <>
            <Button size="small" sx={{ width: '200px' }}>Merge Playlists</Button>
            <Tooltip title="Delete">
              <IconButton onClick={deletePlaylists}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Toolbar>
    );
  }

  EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
  };

  const columns = [
    { field: 'id' },
    { field: 'name', headerName: 'Playlist Name', width: 150 },
    { field: 'privacy', headerName: 'Privacy', width: 100 },
    {
      field: 'songs',
      headerName: 'Songs Count',
      type: 'number',
      width: 100,
    },
    { field: 'spotify_status', headerName: 'Spotify Status', width: 125 },
    { field: 'youtube_status', headerName: 'YouTube Status', width: 125 },
    { field: 'spotify_ref' },
    { field: 'youtube_ref' },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: '100%',
      renderCell: (params) => {
        const row = params.row;
        return (
          <>
            <Button size="small" onClick={() => openPlaylist(row.id)}>Open</Button>
            {/* Pull */}
            {(row.spotify_status === 'LINKED' || row.spotify_status === 'LINKED_MODIFIED') && (
              <Button size="small" onClick={() => pullPlaylist(row.id, 'spotify', row.spotify_ref)}>Pull from Spotify</Button>
            )}
            {(row.youtube_status === 'LINKED' || row.youtube_status === 'LINKED_MODIFIED') && (
              <Button size="small" onClick={() => pullPlaylist(row.id, 'youtube', row.youtube_ref)}>Pull from YouTube</Button>
            )}

            {/* Push */}
            {(row.spotify_status === 'LINKED_MODIFIED') && (
              <Button size="small" onClick={() => pushPlaylist(row.id, 'spotify')}>Push to Spotify</Button>
            )}
            {(row.youtube_status === 'LINKED_MODIFIED') && (
              <Button size="small" onClick={() => pushPlaylist(row.id, 'youtube')}>Push to YouTube</Button>
            )}

            {/* Export */}
            {(row.spotify_status === 'NOT_LINKED') && (
              <Button size="small" onClick={() => exportPlaylist(row.id, 'spotify', row.name)}>Export to Spotify</Button>
            )}
            {(row.youtube_status === 'NOT_LINKED') && (
              <Button size="small" onClick={() => exportPlaylist(row.id, 'youtube', row.name)}>Export to YouTube</Button>
            )}
          </>
        )
      }
    },
  ];

  return (
    <div className='home'>
      <AppBar position="static" sx={{ height: '70px' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              <Button
                onClick={handleOpen}
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

      <Modal
        open={open}
        onClose={handleClose}
      >
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
          <Stack spacing={1}>
            <Typography variant='h5'>Create New Playlist</Typography>
            <form onSubmit={createPlaylist}>
              <TextField type="text" size="small" label="Playlist Name" variant="outlined" value={newPlaylistName} required onChange={(e) => setNewPlaylistName(e.target.value)} />
              <br />
              <Button type="submit" size="small" sx={{ mt: '10px', width: '80px' }}>Create</Button>
            </form>
            <Button color="error" onClick={handleClose} size="small" sx={{ mt: '-20px', width: '75px' }}>Close</Button>
          </Stack>
        </Box>
      </Modal>

      <div style={{ height: 400, width: '90%', display: 'block', margin: 'auto', marginTop: '20px' }}>
        <EnhancedTableToolbar numSelected={selectedPlaylists.length}></EnhancedTableToolbar>
        <DataGrid
          rows={playlistRows}
          columns={columns}
          disableColumnSelector
          localeText={{ noRowsLabel: "No playlists found", noResultsOverlayLabel: "No playlists found" }}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
            columns: {
              columnVisibilityModel: {
                id: false,
                spotify_ref: false,
                youtube_ref: false
              }
            }
          }}
          pageSizeOptions={[5, 10]}
          checkboxSelection
          onRowSelectionModelChange={(ids) => {
            setSelectedPlaylists(ids);
          }}
        />
      </div>
    </div>
  );
}

export default Home;
