import React, { useState, useEffect, useRef } from 'react';
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
  Stack,
  Modal,
  TextField,
  TableContainer,
  Table,
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DataGrid } from '@mui/x-data-grid';


function Playlist() {
  const [playlist, setPlaylist] = useState({});
  const [songs, setSongs] = useState([]);
  const [addSongResults, setAddSongResults] = useState({});
  const [linkSongResults, setLinkSongResults] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showPopup, setShowPopup] = useState("none");
  const [popupSong1, setPopupSong1] = useState({});
  const [popupSong2, setPopupSong2] = useState({});
  const [platform, setPlatform] = useState('');
  const [songToLink, setSongToLink] = useState(null);
  const [songRows, setSongRows] = useState([]);
  const navigate = useNavigate();

  const pl_id = new URLSearchParams(window.location.search).get('pl_id');

  const fetchPlaylist = async () => {
    const response = await axios.get('/pl/get/' + pl_id);
    const playlist = response.data.data.playlist;
    setPlaylist(playlist);
  }

  const fetchSongs = async () => {
    const response = await axios.get('/pl/get-songs/' + pl_id);
    const songs = response.data.data.songs;
    setSongs(songs);

    const rows = [];
    for (const song of songs) {
      const row = {
        id: song.youtube_ref || song.spotify_ref,
        song: song,
        title: song.title,
        artist: song.artist,
        spotify_status: song.spotify_status,
        youtube_status: song.youtube_status
      }
      rows.push(row);
    }
    setSongRows(rows);
  }

  // Fetch songs on component mount
  useEffect(() => {
    fetchPlaylist();
    fetchSongs();
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

  const pullPlaylist = async (pl_id, platform, platform_ref) => {
    navigate('/import?pl_id=' + pl_id + '&platform=' + platform + '&platform_ref=' + platform_ref)
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
    fetchPlaylist();
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

  let cancelTokenSource = null;
  const addSearch = async () => {
    const query = addSearchText;

    if (query.length < 3) {
      setAddSongResults({});
      // Cancel the previous request if it exists
      if (cancelTokenSource) {
        cancelTokenSource.cancel("Search input is too short");
      }
      return;
    }

    // Cancel the previous request if it exists
    if (cancelTokenSource) {
      cancelTokenSource.cancel("New search input received");
    }

    // Create a new cancel token source
    cancelTokenSource = axios.CancelToken.source();

    const results = {};

    try {
      const response = await axios.post('/song/search', { query: query, count: 5 }, { cancelToken: cancelTokenSource.token });

      results.local = response.data.data.local;
      results.spotify = response.data.data.spotify;
      results.youtube = response.data.data.youtube;

      setAddSongResults(results);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Previous search request cancelled:", error.message);
      } else {
        console.error("Error occurred during search:", error);
      }
    }
  };

  let cancelTokenSource2 = null;
  const linkSearch = async () => {
    const query = linkSearchText;

    if (query.length < 3) {
      setLinkSongResults({});
      // Cancel the previous request if it exists
      if (cancelTokenSource2) {
        cancelTokenSource2.cancel("Search input is too short");
      }
      return;
    }

    // Cancel the previous request if it exists
    if (cancelTokenSource2) {
      cancelTokenSource2.cancel("New search input received");
    }

    // Create a new cancel token source
    cancelTokenSource2 = axios.CancelToken.source();

    const results = {};

    try {
      const response = await axios.post('/' + platform + '/search', { query: query, count: 5 }, { cancelToken: cancelTokenSource2.token });
      results.results = response.data.data.results;
      setLinkSongResults(results);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Previous search request cancelled:", error.message);
      } else {
        console.error("Error occurred during search:", error);
      }
    }
  };

  const getRecommendedSongs = async () => {
    const response = await axios.post('/spotify/recommend', { songs: songs, count: 5 });
    const recommended_songs = response.data.data.songs;
    const results = {};
    results.spotify = recommended_songs;
    results.spotifyIsRecommended = true;
    setAddSongResults(results);
  }

  // let resolveMerge;
  // let rejectMerge;
  const mergeVerification = (song1, song2) => {
    return new Promise((resolve, reject) => {
      setShowPopup("block");
      document.getElementById('popup-yes').addEventListener('click', () => {
        setShowPopup("none");
        resolve(true);
      });
      document.getElementById('popup-no').addEventListener('click', () => {
        setShowPopup("none");
        resolve(false);
      });
      // resolveMerge = resolve;
      // rejectMerge = reject;
      setPopupSong1(song1);
      setPopupSong2(song2);
    });
  }

  const addSong = async (platform, platform_ref) => {
    setShowAddModal(false);

    // api interface helpers
    const merge = async (song_1, song_2) => {
      const mergeResponse = await axios.post('/song/merge', { song_1_id: song_1.song_id, song_2_id: song_2.song_id });
      if (mergeResponse.data.status !== 'success') {
        alert('Error merging songs: ' + mergeResponse.data.message || 'An error occurred');
        return null;
      }
      return mergeResponse.data.data.song;
    }
    const create = async (platform, platform_ref, soft_match_ref = null) => {
      const createResponse = await axios.post('/song/create', { platform: platform, platform_ref: platform_ref, soft_match_ref: soft_match_ref });
      if (createResponse.data.status !== 'success') {
        alert('Error adding song: ' + createResponse.data.message || 'An error occurred');
        return null;
      }
      return createResponse.data.data.song;
    }
    const precreate = async (platform, platform_ref) => {
      const precreateResponse = await axios.post('/song/precreate', { platform: platform, platform_ref: platform_ref });

      alert('Precreate Type: ' + precreateResponse.data.message); // DEBUG

      if (precreateResponse.data.status === 'fail') {
        alert('Error precreating song: ' + precreateResponse.data.message || 'An error occurred');
        return null;
      }

      // no need to create a new song
      if (precreateResponse.data.status === 'exists') {
        return precreateResponse.data.data.song;
      }

      // create a new song
      const song_1 = await create(platform, platform_ref, precreateResponse.data.data.soft_match_ref);

      // no soft matches found, we're done
      if (precreateResponse.data.status === 'no_match') {
        return song_1;
      }

      // song we've soft matched with
      const song_2 = precreateResponse.data.data.match;

      // if it's a bilateral match, merge automatically
      if (precreateResponse.data.status === 'soft_match_bilateral') {
        return await merge(song_1, song_2);
      } else if (precreateResponse.data.status === 'soft_match_unilateral') {
        const mergeResult = await mergeVerification(song_1, song_2);
        if (mergeResult) {
          return await merge(song_1, song_2);
        } else {
          return song_1;
        }
      } else {
        alert('Error precreating song: Unexpected status returned');
        return null;
      }
    }
    const addToPlaylist = async (pl_id, song_id) => {
      // Add the song to the playlist
      const response = await axios.get('/pl/add-song/' + pl_id + '/' + song_id);
      if (response.data.status === 'success') {
        alert(response.data.message);
        fetchPlaylist(); // get link status changes
        fetchSongs();
      } else {
        alert('Error adding song: ' + response.data.message || 'An error occurred');
      }
    }

    // get song id
    let song_id = null;
    if (platform !== 'local') {
      const song = await precreate(platform, platform_ref)
      if (!song) {
        return;
      }
      song_id = song.song_id;
    } else {
      song_id = platform_ref;
    }

    // Add the song to the playlist
    await addToPlaylist(pl_id, song_id);
  }

  const removeSong = async (song_id) => {
    const response = await axios.get('/pl/remove-song/' + pl_id + '/' + song_id);
    if (response.data.status === 'success') {
      alert(response.data.message);
      fetchPlaylist(); // get link status changes
      fetchSongs();
    } else {
      alert('Error removing song: ' + response.data.message || 'An error occurred');
    }
  }

  const linkSong = async (song_id, platform, platform_ref) => {
    setShowLinkModal(false);
    const response = await axios.post('/song/link', { song_id: song_id, platform: platform, platform_ref: platform_ref });
    if (response.data.status === 'success') {
      alert(response.data.message);
      fetchSongs();
    } else {
      alert('Error linking song: ' + response.data.message || 'An error occurred');
    }
  }

  // Launch the link search window
  const launchLinkSearch = (song, platform) => {
    setPlatform(platform);
    setSongToLink(song);
    setLinkSearchText(song.title + ' ' + song.artist);
    setShowLinkModal(true);
  }

  useEffect(() => {
    if (showLinkModal) {
      setLinkSongResults({});
      linkSearch();
    }
  }, [showLinkModal]);

  useEffect(() => {
    if (showAddModal) {
      setAddSongResults({});
      getRecommendedSongs();
    }
  }, [showAddModal]);

  const share = async () => {
    const response = await axios.post('/pl/share/' + pl_id);
    if (response.data.status === 'success') {
      alert(response.data.message);
      fetchPlaylist();
    } else {
      alert('Error sharing playlist: ' + response.data.message || 'An error occurred');
    }
  }

  const copySharingLink = () => {
    const sharingLink = window.location.origin + '/share?pl_id=' + playlist.pl_id;
    navigator.clipboard.writeText(sharingLink);
    alert('Sharing link copied to clipboard');
  }

  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const [linkSearchText, setLinkSearchText] = useState("");
  const [addSearchText, setAddSearchText] = useState("");

  const handleCloseLinkModal = () => setShowLinkModal(false);
  const handleCloseAddModal = () => setShowAddModal(false);

  const columns = [
    { field: 'id' },
    { field: 'song' },
    { field: 'title', headerName: 'Title', sortable: false, flex: 1 },
    { field: 'artist', headerName: 'Artist', sortable: false, flex: 1 },
    { 
      field: 'spotify_status',
      headerName: 'Spotify Status',
      sortable: false,
      flex: 1,
      renderCell: (params) => {
        const song = params.row.song;
        return (
          <>
            {song.spotify_status === "HARD_MATCH" ? song.spotify_status : <Button variant="outllined" size="small" onClick={() => launchLinkSearch(song, 'spotify')}>{song.spotify_status}</Button>}
          </>
        )
      }
    },
    { 
      field: 'youtube_status',
      headerName: 'YouTube Status',
      sortable: false,
      flex: 1,
      renderCell: (params) => {
        const song = params.row.song;
        return (
          <>
            {song.youtube_status === "HARD_MATCH" ? song.youtube_status : <Button variant="outlined" size="small" onClick={() => launchLinkSearch(song, 'youtube')}>{song.youtube_status}</Button>}
          </>
        )
      }
    },
    { 
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      renderCell: (params) => {
        const song = params.row.song;
        return (
          <>
            <Button color="error" onClick={() => removeSong(song.song_id)}>Remove</Button>
          </>
        )
      }
    },
  ]

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
              <Button
                onClick={() => {
                  setShowAddModal(true);
                  setAddSearchText("");
                }}
                sx={{ ml: '10px', my: 2, color: 'white', display: 'block' }}
              >
                Add a song
              </Button>

              {/* Pull */}
              {(playlist.spotify_status === 'LINKED' || playlist.spotify_status === 'LINKED_MODIFIED') && (
                <Button size="small"
                  onClick={() => pullPlaylist(playlist.pl_id, 'spotify', playlist.spotify_ref)}
                  sx={{ ml: '10px', my: 2, color: 'white', display: 'block' }}>Pull from Spotify</Button>
              )}
              {(playlist.youtube_status === 'LINKED' || playlist.youtube_status === 'LINKED_MODIFIED') && (
                <Button size="small"
                  onClick={() => pullPlaylist(playlist.pl_id, 'youtube', playlist.youtube_ref)}
                  sx={{ ml: '10px', my: 2, color: 'white', display: 'block' }}>Pull from YouTube</Button>
              )}

              {/* Push */}
              {(playlist.spotify_status === 'LINKED_MODIFIED') && (
                <Button size="small"
                  onClick={() => pushPlaylist(playlist.pl_id, 'spotify')}
                  sx={{ ml: '10px', my: 2, color: 'white', display: 'block' }}>Push to Spotify</Button>
              )}
              {(playlist.youtube_status === 'LINKED_MODIFIED') && (
                <Button size="small"
                  onClick={() => pushPlaylist(playlist.pl_id, 'youtube')}
                  sx={{ ml: '10px', my: 2, color: 'white', display: 'block' }}>Push to YouTube</Button>
              )}

              {/* Export */}
              {(playlist.spotify_status === 'NOT_LINKED') && (
                <Button size="small"
                  onClick={() => exportPlaylist(playlist.pl_id, 'spotify', playlist.name)}
                  sx={{ ml: '10px', my: 2, color: 'white', display: 'block' }}>Export to Spotify</Button>
              )}
              {(playlist.youtube_status === 'NOT_LINKED') && (
                <Button size="small"
                  onClick={() => exportPlaylist(playlist.pl_id, 'youtube', playlist.name)}
                  sx={{ ml: '10px', my: 2, color: 'white', display: 'block' }}>Export to YouTube</Button>
              )}
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
      
      <Modal open={showAddModal} onClose={handleCloseAddModal} sx={{ top: '10%', left: '20%', right: '20%', overflow: 'scroll', height: '500px', width: 'auto', border: '1px solid black' }}>
        <Box sx={{ backgroundColor: 'white', padding: '20px' }}>
          <Typography variant="h6">Add a Song</Typography>
          <TextField id="add_search" type="text" placeholder="Search for a song" onKeyDown={(event) => { if (event.key === 'Enter') addSearch(); }}
            value={addSearchText} onChange={(e) => setAddSearchText(e.target.value)} sx={{ width: '100%', mt: '20px', mb: '10px' }} autoFocus
          /><br/>
          <Button size="small" variant="contained" onClick={addSearch}>Search</Button><br />
          <br />
          <Typography variant="subtitle1" sx={{ mb: '5px' }}>Local Results</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {addSongResults.local && addSongResults.local.map(song => (
                  <>
                  <TableRow key={song.song_id}>
                    <TableCell>{song.title}</TableCell>
                    <TableCell>{song.artist}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => addSong("local", song.song_id)}>Add from Local</Button>
                    </TableCell>
                  </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" sx={{ mt: '15px', mb: '5px' }}>Spotify Results {addSongResults.spotifyIsRecommended && ('(Recommended)')}</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {addSongResults.spotify && addSongResults.spotify.map(song => (
                  <>
                  <TableRow key={song.spotify_ref}>
                    <TableCell>{song.title}</TableCell>
                    <TableCell>{song.artist}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => addSong("spotify", song.spotify_ref)}>Add from Spotify</Button>
                    </TableCell>
                  </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="subtitle1" sx={{ mt: '15px', mb: '5px' }}>YouTube Results</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {addSongResults.youtube && addSongResults.youtube.map(song => (
                  <>
                  <TableRow key={song.youtube_ref}>
                    <TableCell>{song.title}</TableCell>
                    <TableCell>{song.artist}</TableCell>
                    <TableCell>
                      <Button sx={{ whiteSpace: 'nowrap' }} size="small" onClick={() => addSong("youtube", song.youtube_ref)}>Add from YouTube</Button>
                    </TableCell>
                  </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <br/>
          <Button variant="contained" size="small" color="error" onClick={handleCloseAddModal}>Close</Button>
        </Box>
      </Modal>
      
      <Modal open={showLinkModal} onClose={handleCloseLinkModal}>
        <Box style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
          <Typography variant="h6">Link a Song</Typography>
          <TextField id="link_search" type="text" placeholder="Search for a song" onKeyDown={(event) => { if (event.key === 'Enter') linkSearch();}}
            value={linkSearchText} onChange={(e) => setLinkSearchText(e.target.value)} sx={{ width: '100%', mt: '20px', mb: '10px' }} autoFocus
          /><br/>
          <Button variant="contained" size="small" onClick={linkSearch}>Search</Button><br/>
          <Typography variant="subtitle1" sx={{ mt: '20px', mb: '10px' }}>Search Results</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linkSongResults.results && linkSongResults.results.map(song => (
                  <>
                  <TableRow key={song.youtube_ref || song.spotify_ref}>
                    <TableCell>{song.title}</TableCell>
                    <TableCell>{song.artist}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => linkSong(songToLink.song_id, platform, song.youtube_ref || song.spotify_ref)}>Link</Button>
                    </TableCell>
                  </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <br/>
          <Button variant="contained" size="small" color="error" onClick={handleCloseLinkModal}>Close</Button>
        </Box>
      </Modal>
      
      {/* <Modal open={showPopup}>
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
          <h2>Merge Songs?</h2>
          <p>Do you want to merge these songs?</p>
          <b>Song 1:</b>
          <p>Title: {popupSong1.title}</p>
          <p>Artist: {popupSong1.artist}</p>
          <b>Song 2:</b>
          <p>Title: {popupSong2.title}</p>
          <p>Artist: {popupSong2.artist}</p>
          <button onClick={ () => { resolveMerge(); setShowPopup(false); }}>Yes</button>
          <button onClick={ ()=> { rejectMerge(); setShowPopup(false); }}>No</button>
        </div>
      </Modal> */}
      <div style={{ display: showPopup, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
        <h2>Merge Songs?</h2>
        <p>Do you want to merge these songs?</p>
        <b>Song 1:</b>
        <p>Title: Placeholder title</p>
        <p>Artist: Placeholder artist</p>
        <b>Song 2:</b>
        <p>Title: Placeholder title</p>
        <p>Artist: Placeholder artist</p>
        <button id="popup-yes">Yes</button>
        <button id="popup-no">No</button>
      </div>


      <div style={{ padding: '20px' }}>
        <div>
          <Stack spacing={1}>
            <Typography variant="h5">Playlist: {playlist.name}</Typography>
            <Typography variant="subtitle1">Songs Count: {songs.length}</Typography>
            <Typography variant="subtitle1">Spotify Status: {playlist.spotify_status}</Typography>
            <Typography variant="subtitle1">YouTube Status: {playlist.youtube_status}</Typography>
            <Typography variant="subtitle1">Privacy: {playlist.privacy}</Typography>
            <Stack direction='row' spacing={2}>
              {playlist && (<Button variant="contained" size="small" onClick={share}>Toggle Privacy</Button>)}
              {playlist && playlist.privacy === 'SHARED' && (<Button size="small" variant="outlined" onClick={copySharingLink}>Copy Sharing Link</Button>)}
            </Stack>
          </Stack>
        </div>

        <Typography variant="h5" sx={{ mt: '20px', mb: '15px' }}>Songs</Typography>
        
        <DataGrid
          rows={songRows}
          columns={columns}
          disableColumnSelector
          autoHeight
          localeText={{ noRowsLabel: "No songs found", noResultsOverlayLabel: "No songs found" }}
          size="small"
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            columns: {
              columnVisibilityModel: {
                id: false,
                song: false
              }
            },
            pagination: { paginationModel: { pageSize: 25 } }
          }}
        />
      </div>
    </div>
  );
}

export default Playlist;
