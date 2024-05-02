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

const Import = () => {
  const [disabled, setDisabled] = useState(false);
  const [platform, setPlatform] = useState(''); // ['spotify', 'youtube']
  const [playlists, setPlaylists] = useState([]);
  const [playlistIdx, setPlaylistIdx] = useState('');
  const [songs, setSongs] = useState([]);
  const [readyToImport, setReadyToImport] = useState(false);
  const [showPopup, setShowPopup] = useState("none");
  const [popupSong1, setPopupSong1] = useState({});
  const [popupSong2, setPopupSong2] = useState({});
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const pl_id = params.get('pl_id');

  useEffect(() => {
    if (pl_id) {
      setDisabled(true);
      setPlatform(params.get('platform'));
    }
  });

  useEffect(() => { // handle platform change
    if (!platform) return;

    const fetchPlaylists = async () => {
      // clear existing
      setPlaylists([]);
      setPlaylistIdx('');
      setSongs([]);

      // fetch playlists and update
      const response = await axios.get(`/${platform}/get-all-pls`);
      const loadedPlaylists = response.data.data.playlists;
      setPlaylists(loadedPlaylists);

      // select playlist if pl_id is provided
      if (pl_id) {
        const selectedPlaylistIdx = loadedPlaylists.findIndex(playlist => playlist[`${platform}_ref`] === params.get('platform_ref'));
        setPlaylistIdx(selectedPlaylistIdx);
      }
    }
    fetchPlaylists();
  }, [platform]);

  useEffect(() => { // handle playlist change
    if (!playlistIdx && playlistIdx !== 0) return;

    const playlist = playlists[playlistIdx];

    const fetchSongs = async () => {
      // clear existing
      setSongs([]);

      // fetch songs and update
      const response = await axios.post(`/${platform}/pull`, { platform_ref: playlist[`${platform}_ref`] })
      const loadedSongs = response.data.data.songs;
      setSongs(loadedSongs);

      // precreate songs
      for (const song of loadedSongs) {
        axios.post('/song/precreate', { platform: platform, platform_ref: song[`${platform}_ref`] }).then((response) => {
          song.precreateResult = response;
          setSongs([...loadedSongs]);
        });
      }
    }
    fetchSongs();
  }, [playlistIdx]);

  useEffect(() => { // check if ready to import
    if (songs.length === 0) {
      setReadyToImport(false);
      return;
    }

    for (let song of songs) {
      //check that all songs have been precreated
      if (!song.precreateResult) {
        setReadyToImport(false);
        // DEBUG console.log("Song not precreated")
        return;
      }

      //check that all unilateral matches have a merge set
      if (song.precreateResult.data.status === "soft_match_unilateral" && !song.merge) {
        setReadyToImport(false);
        // DEBUG console.log("Unilateral match without merge set")
        return;
      }
    }

    // DEBUG console.log("Ready to import")
    setReadyToImport(true);
  }, [songs]);

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

  const runMergeVerification = async (song) => {
    const song1 = song.precreateResult.data.song;
    const song2 = song.precreateResult.data.match;
    const result = await mergeVerification(song1, song2);
    song.mergeResult = result;
    setSongs([...songs]);
  }

  const runImport = async () => {
    setReadyToImport(false);

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
    const postcreate = async (song) => {
      const precreateResponse = song.precreateResult;

      // DEBUG alert('Precreate Type: ' + precreateResponse.data.message);

      if (precreateResponse.data.status === 'fail') {
        alert('Error precreating song: ' + precreateResponse.data.message || 'An error occurred');
        return null;
      }

      // no need to create a new song
      if (precreateResponse.data.status === 'exists') {
        return precreateResponse.data.data.song;
      }

      // create a new song
      const song_1 = await create(platform, song[`${platform}_ref`], precreateResponse.data.data.soft_match_ref);

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
        const mergeResult = song.mergeResult;
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
    const createPlaylist = async (name, songs, platform, platform_ref) => {
      const createResponse = await axios.post('/pl/create', { name: name, creation_type: 'IMPORT', songs: songs, platform: platform, platform_ref: platform_ref });
      if (createResponse.data.status !== 'success') {
        alert('Error creating playlist: ' + createResponse.data.message || 'An error occurred');
        return null;
      }
      return createResponse.data.data.playlist;
    }
    const pullPlaylist = async (pl_id, songs) => {
      const pullResponse = await axios.post(`/pl/pull/${pl_id}`, { songs: songs, platform: platform });
      if (pullResponse.data.status !== 'success') {
        alert('Error pulling playlist: ' + pullResponse.data.message || 'An error occurred');
        return null;
      }
      return pullResponse.data.data.playlist;
    }

    // create songs
    for (let song of songs) {
      const createdSong = await postcreate(song);
      if (!createdSong) {
        return;
      }
      song.song_id = createdSong.song_id;
    }

    // check for pull (existing playlist)
    const song_ids = songs.map(song => song.song_id);
    if (pl_id) {
      // pull songs to playlist
      const pulledPlaylist = await pullPlaylist(pl_id, song_ids);

      // redirect to playlist
      alert('Playlist updated, redirecting: ' + pulledPlaylist.name);
      navigate('/playlist?pl_id=' + pulledPlaylist.pl_id);
    } else {
      // create playlist
      const playlist = playlists[playlistIdx];
      const createdPlaylist = await createPlaylist(playlist.name, song_ids, platform, playlist[`${platform}_ref`]);

      // redirect to playlist
      alert('Playlist created, redirecting: ' + createdPlaylist.name);
      navigate('/playlist?pl_id=' + createdPlaylist.pl_id);
    }
  }

  // Handle logout
  const handleLogout = async () => {
    const response = await axios.get('/auth/logout');
    if (response.data.status === 'success') {
      navigate('/login');
    } else {
      alert('Error logging out: ' + response.data.message || 'An error occurred');
    }
  };

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

      <h2>Import Playlist</h2>

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

      <div>
        <label htmlFor="platform">Select Platform:</label>
        <select id="platform" value={platform} onChange={(event) => { setPlatform(event.target.value) }} disabled={disabled}>
          <option value="">Select Platform</option>
          <option value="spotify">Spotify</option>
          <option value="youtube">Youtube</option>
        </select>
      </div>

      {platform && playlists.length === 0 && (
        <span>Loading playlists...</span>
      )}

      {playlists.length > 0 && (
        <div>
          <label htmlFor="playlist">Select Playlist:</label>
          <select id="playlist" value={playlistIdx} onChange={(event) => { setPlaylistIdx(event.target.value) }} disabled={disabled}>
            <option value="">Select Playlist</option>
            {playlists.map((playlist, idx) => (
              <option key={idx} value={idx}>
                {playlist.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {playlistIdx && songs.length === 0 && (
        <span>Loading songs...</span>
      )}

      {songs.length > 0 && (
        <div>
          <h3>Songs</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.map(song => (
                <tr key={song.id}>
                  <td>{song.title}</td>
                  <td>{song.artist}</td>
                  <td>{song.precreateResult ? song.precreateResult.data.message : 'Loading...'}</td>
                  <td>{song.precreateResult ? (
                    song.precreateResult.data.status === 'soft_match_unilateral' ? (
                      <button onClick={() => runMergeVerification(song)}>Merge?</button>
                    ) : 'None'
                  ) : 'Loading...'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      }

      <br />
      <button onClick={runImport} disabled={!readyToImport}>{pl_id ? "Pull" : "Import"}</button>


    </div >
  );
};

export default Import;
