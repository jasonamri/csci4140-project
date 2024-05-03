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
  FormControl,
  InputLabel,
  Select,
  Alert,
  TableContainer,
  Table,
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Paper,
  TablePagination,
  Modal,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Import = () => {
  const [disabled, setDisabled] = useState(false);
  const [platform, setPlatform] = useState(''); // ['spotify', 'youtube']
  const [playlists, setPlaylists] = useState([]);
  const [playlistIdx, setPlaylistIdx] = useState('');
  const [songs, setSongs] = useState([]);
  const [readyToImport, setReadyToImport] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
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
      setShowPopup(true);
      document.getElementById('popup-yes').addEventListener('click', () => {
        setShowPopup(false);
        resolve(true);
      });
      document.getElementById('popup-no').addEventListener('click', () => {
        setShowPopup(false);
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
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Import Playlist</Typography>

        <Modal keepMounted open={showPopup}>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
            <Stack spacing={1}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Merge Songs?</Typography>
              <Typography variant="subtitle1">Do you want to merge these songs?</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Song 1:</Typography>
              <Typography variant="subtitle1">Title: {popupSong1.title}</Typography>
              <Typography variant="subtitle1">Artist: {popupSong1.artist}</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Song 2:</Typography>
              <Typography variant="subtitle1">Title: {popupSong2.title}</Typography>
              <Typography variant="subtitle1">Artist: {popupSong2.artist}</Typography>
              <Stack direction="row" spacing={1}>
                <Button id="popup-yes" variant="contained" size="small">Yes</Button>
                <Button id="popup-no" variant="contained" color="error" size="small">No</Button>
              </Stack>
            </Stack>
          </div>
        </Modal>

        <div>
          <FormControl size="small" sx={{ width: '200px', mt: '15px' }}>
            <InputLabel id="platform-label">Select Platform</InputLabel>
            <Select
              labelId="platform-label"
              id="platform"
              value={platform}
              label="Select Platform"
              onChange={(event) => { setPlatform(event.target.value) }}
              disabled={disabled}
            >
              <MenuItem value="spotify">Spotify</MenuItem>
              <MenuItem value="youtube">YouTube</MenuItem>
            </Select>
          </FormControl>
        </div>

        {platform && playlists.length === 0 && (
          <><Alert severity="info" sx={{ mt: '20px', width: '200px' }}>Loading playlists...</Alert></>
        )}

        {playlists.length > 0 && (
          <div>
            <FormControl size="small" sx={{ width: '200px', mt: '20px' }}>
              <InputLabel id="playlist-label">Select Playlist</InputLabel>
              <Select
                labelId="playlist-label"
                id="playlist"
                value={playlistIdx}
                label="Select Platform"
                onChange={(event) => { setPlaylistIdx(event.target.value) }}
                disabled={disabled}
              >
                {playlists.map((playlist, idx) => (
                  <MenuItem key={idx} value={idx}>
                    {playlist.name}
                  </MenuItem>
                ))}
                <MenuItem value="spotify">Spotify</MenuItem>
                <MenuItem value="youtube">YouTube</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}

        {playlistIdx && songs.length === 0 && (
          <><Alert severity="info" sx={{ mt: '20px', width: '200px' }}>Loading songs...</Alert></>
        )}

        {songs.length > 0 && (
          <div>
            <Typography variant="h5" sx={{ mt: '20px', mb: '10px' }}>Songs</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow >
                    <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Artist</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {songs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(song => (
                    <TableRow key={song.id}>
                      <TableCell>{song.title}</TableCell>
                      <TableCell>{song.artist}</TableCell>
                      <TableCell>{song.precreateResult ? song.precreateResult.data.message : 'Loading...'}</TableCell>
                      <TableCell>{song.precreateResult ? (
                        song.precreateResult.data.status === 'soft_match_unilateral' ? (
                          <Button size="small" onClick={() => runMergeVerification(song)}>Merge?</Button>
                        ) : 'None'
                      ) : 'Loading...'}</TableCell>
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
        )
        }
        <br />
        <Button variant="contained" size="small" onClick={runImport} disabled={!readyToImport}>{pl_id ? "Pull" : "Import"}</Button>
      </div>


    </div >
  );
};

export default Import;
