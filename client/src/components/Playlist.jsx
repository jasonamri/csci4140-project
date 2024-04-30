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
  MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function Playlist() {
  const [playlist, setPlaylist] = useState({});
  const [songs, setSongs] = useState([]);
  const [songResults, setSongResults] = useState({});
  const [songResults2, setSongResults2] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [showPopup, setShowPopup] = useState("none");
  const [popupSong1, setPopupSong1] = useState({});
  const [popupSong2, setPopupSong2] = useState({});
  const [platform, setPlatform] = useState('');
  const [songId, setSongId] = useState('');
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
  }

  // Fetch songs on component mount
  useEffect(() => {
    fetchPlaylist();
    fetchSongs();
  });

  // Handle logout
  const handleLogout = async () => {
    const response = await axios.get('/auth/logout');
    if (response.data.status === 'success') {
      navigate('/login');
    } else {
      alert('Error logging out: ' + response.data.message || 'An error occurred');
    }
  };

  let cancelTokenSource = null;
  const search = async () => {
    const query = document.querySelector('input').value;

    if (query.length < 3) {
      setSongResults({});
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

      setSongResults(results);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Previous search request cancelled:", error.message);
      } else {
        console.error("Error occurred during search:", error);
      }
    }
  };

  let cancelTokenSource2 = null;
  const search2 = async () => {
    const query = document.querySelector('input').value;

    if (query.length < 3) {
      setSongResults2({});
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
      setSongResults2(results);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Previous search request cancelled:", error.message);
      } else {
        console.error("Error occurred during search:", error);
      }
    }
  };

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
      setPopupSong1(song1);
      setPopupSong2(song2);
    });
  }

  const addSong = async (platform, platform_ref) => {
    setShowModal(!showModal);

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
      fetchSongs();
    } else {
      alert('Error removing song: ' + response.data.message || 'An error occurred');
    }
  }

  const linkSong = async (song_id, platform, platform_ref) => {
    setShowModal2(!showModal2);
    const response = await axios.post('/song/link', { song_id: song_id, platform: platform, platform_ref: platform_ref });
    if (response.data.status === 'success') {
      alert(response.data.message);
      fetchSongs();
    } else {
      alert('Error linking song: ' + response.data.message || 'An error occurred');
    }
  }

  // Toggle the new playlist modal
  const toggleModal = () => {
    setShowModal(!showModal);
  };

  // Toggle the link modal
  const toggleModal2 = (song_id, platform) => {
    setPlatform(platform);
    setSongId(song_id);
    setShowModal2(!showModal2);
  }

  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
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
              <Button
                onClick={toggleModal}
                sx={{ ml: '10px', my: 2, color: 'white', display: 'block' }}
              >
                Add a song
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
          <h2>Add a song</h2>
          <input type="text" placeholder="Search for a song" /><br />
          <button onClick={search}>Search</button><br />
          <br />
          <h4>Local Results</h4>
          <table border="1">
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songResults.local && songResults.local.map(song => (
                <tr key={song.song_id}>
                  <td>{song.title}</td>
                  <td>{song.artist}</td>
                  <td>
                    <button onClick={() => addSong("local", song.song_id)}>Add from Local</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>Spotify Results</h4>
          <table border="1">
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songResults.spotify && songResults.spotify.map(song => (
                <tr key={song.spotify_ref}>
                  <td>{song.title}</td>
                  <td>{song.artist}</td>
                  <td>
                    <button onClick={() => addSong("spotify", song.spotify_ref)}>Add from Spotify</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>YouTube Results</h4>
          <table border="1">
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songResults.youtube && songResults.youtube.map(song => (
                <tr key={song.youtube_ref}>
                  <td>{song.title}</td>
                  <td>{song.artist}</td>
                  <td>
                    <button onClick={() => addSong("youtube", song.youtube_ref)}>Add from YouTube</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <br />

          <button onClick={toggleModal}>Close</button>
        </div>
      )}

      {showModal2 && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
          <h2>Link a song</h2>
          <input type="text" placeholder="Search for a song" /><br />
          <button onClick={search2}>Search</button><br />
          <br />
          <h4>Search Results</h4>
          <table border="1">
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songResults2.results && songResults2.results.map(song => (
                <tr key={song.youtube_ref || song.spotify_ref}>
                  <td>{song.title}</td>
                  <td>{song.artist}</td>
                  <td>
                    <button onClick={() => linkSong(songId, platform, song.youtube_ref || song.spotify_ref)}>Link</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <br />

          <button onClick={toggleModal}>Close</button>
        </div>
      )}


      <div style={{ display: showPopup, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
        <h2>Merge Songs?</h2>
        <p>Do you want to merge these songs?</p>
        <b>Song 1:</b>
        <p>Title: {popupSong1.title}</p>
        <p>Artist: {popupSong1.artist}</p>
        <b>Song 2:</b>
        <p>Title: {popupSong2.title}</p>
        <p>Artist: {popupSong2.artist}</p>
        <button id="popup-yes">Yes</button>
        <button id="popup-no">No</button>
      </div>


      <div style={{ padding: '20px' }}>
        <div>
          <h2>Playlist: {playlist.name}</h2>
          <p>Privacy: {playlist.privacy}</p>
          <p>Songs Count: {songs.length}</p>
          <p>Spotify Status: {playlist.spotify_status}</p>
          <p>YouTube Status: {playlist.youtube_status}</p>
        </div>
        <h3>Songs</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Spotify Status</th>
              <th>YouTube Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {songs.map(song => (
              <tr key={song.song_id}>
                <td>{song.title}</td>
                <td>{song.artist}</td>
                <td>{song.spotify_status === "HARD_MATCH" ? song.spotify_status : <button onClick={() => toggleModal2(song.song_id, 'spotify')}>{song.spotify_status}</button>}</td>
                <td>{song.youtube_status === "HARD_MATCH" ? song.youtube_status : <button onClick={() => toggleModal2(song.song_id, 'youtube')}>{song.youtube_status}</button>}</td>
                <td>
                  <button onClick={() => removeSong(song.song_id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Playlist;
