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
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
  Switch,
  FormControlLabel,
  TablePagination,
  Table,
  Paper,
  TableBody,
  TableContainer,
  alpha,
  TableSortLabel
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid } from '@mui/x-data-grid';

// const rows = [
//   { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
//   { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
//   { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
//   { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
//   { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
//   { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
//   { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
//   { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
//   { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
// ];

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
        <Tooltip title="Delete">
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

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
    // setPlaylistRows();
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
    const toggleModal = () => {
        setShowModal(!showModal);
    };

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

  const columns = [
    { field: 'id' },
    { field: 'name', headerName: 'Playlist Name', width: 200 },
    { field: 'privacy', headerName: 'Privacy', width: 100 },
    {
      field: 'songs',
      headerName: 'Songs Count',
      type: 'number',
      width: 150,
    },
    { field: 'spotify', headerName: 'Spotify Status', width: 150 },
    { field: 'youtube', headerName: 'YouTube Status', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 100,
      renderCell: ({ row }) => {
        <Button onClick={() => openPlaylist(row.id)}>Open</Button>
      }
    },
  ];

  // const createPlaylistRows = () => {
  //   const rows = [];
  //   for (const playlist of playlists) {
  //     const row = { 
  //       id: playlist.pl_id,
  //       name: playlist.name,
  //       privacy: playlist.privacy,
  //       songs: playlist.songs.length,
  //       spotify: playlist.spotify_status,
  //       youtube: playlist.youtube_status,
  //     };
  //     rows.push(row);
  //   }
  //   setPlaylistRows(rows);
  // }

    return (
        <div className='home'>
            <AppBar position="static" sx={{ height: '70px' }}>
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

      {showModal && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
          <Stack spacing={2}>
            <Typography variant='h5'>Create New Playlist</Typography>
            <form onSubmit={createPlaylist}>
              <TextField type="text" size="small" label="Playlist Name" variant="outlined" value={newPlaylistName} required onChange={(e) => setNewPlaylistName(e.target.value)} />
              <br />
              <Button variant="contained" type="submit" size="small" sx={{ mt: '10px' }}>Create</Button>
            </form>
            <Button variant="contained" color="error" onClick={toggleModal} size="small" sx={{ width: '50px' }}>Close</Button>
          </Stack>
        </div>
      )}

      <div style={{ height: 400, width: '100%' }}>
        <EnhancedTableToolbar numSelected={selectedPlaylists.length}></EnhancedTableToolbar>
        <DataGrid
          rows={playlistRows}
          columns={columns}
          disableColumnSelector
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
            columns: {
              columnVisibilityModel: {
                id: false,
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

            <div style={{ padding: '20px' }}>
                <h2>Playlists</h2>
                {playlists.length === 0 && <p>No playlists found</p>}

                {playlists.length > 0 && (
                    <div style={{ padding: '20px' }}>
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
                                            {/* Pull */}
                                            {(playlist.spotify_status === 'LINKED' || playlist.spotify_status === 'LINKED_MODIFIED') && (
                                                <button onClick={() => pullPlaylist(playlist.pl_id, 'spotify', playlist.spotify_ref)}>Pull from Spotify</button>
                                            )}
                                            {(playlist.youtube_status === 'LINKED' || playlist.youtube_status === 'LINKED_MODIFIED') && (
                                                <button onClick={() => pullPlaylist(playlist.pl_id, 'youtube', playlist.youtube_ref)}>Pull from YouTube</button>
                                            )}

                                            {/* Push */}
                                            {(playlist.spotify_status === 'LINKED_MODIFIED') && (
                                                <button onClick={() => pushPlaylist(playlist.pl_id, 'spotify')}>Push to Spotify</button>
                                            )}
                                            {(playlist.youtube_status === 'LINKED_MODIFIED') && (
                                                <button onClick={() => pushPlaylist(playlist.pl_id, 'youtube')}>Push to YouTube</button>
                                            )}

                                            {/* Export */}
                                            {(playlist.spotify_status === 'NOT_LINKED') && (
                                                <button onClick={() => exportPlaylist(playlist.pl_id, 'spotify', playlist.name)}>Export to Spotify</button>
                                            )}
                                            {(playlist.youtube_status === 'NOT_LINKED') && (
                                                <button onClick={() => exportPlaylist(playlist.pl_id, 'youtube', playlist.name)}>Export to YouTube</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
