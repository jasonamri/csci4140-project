import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Playlist() {
    const [playlist, setPlaylist] = useState({});
    const [songs, setSongs] = useState([]);
    const [songResults, setSongResults] = useState({});
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const pl_id = new URLSearchParams(window.location.search).get('pl_id');

    const fetchPlaylist = async () => {
        const response = await axios.get('/pl/get/'+pl_id);
        const playlist = response.data.data.playlist;
        setPlaylist(playlist);
    }

    const fetchSongs = async () => {
        const response = await axios.get('/pl/get-songs/'+pl_id);
        const songs = response.data.data.songs;
        console.log(songs);
        setSongs(songs);
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
            // Send all requests in parallel
            const [responseLocal, responseSpotify, responseYoutube] = await Promise.all([
                axios.post('/song/search', { query: query, count: 5 }, { cancelToken: cancelTokenSource.token }),
                axios.post('/spotify/search', { query: query, count: 5 }, { cancelToken: cancelTokenSource.token }),
                axios.post('/youtube/search', { query: query, count: 5 }, { cancelToken: cancelTokenSource.token })
            ]);

            // Process local results
            if (responseLocal.data.status === 'success') {
                results.local = responseLocal.data.data.results;
            }

            // Process Spotify results
            if (responseSpotify.data.status === 'success') {
                results.spotify = responseSpotify.data.data.results;
            }

            // Process YouTube results
            if (responseYoutube.data.status === 'success') {
                results.youtube = responseYoutube.data.data.results;
            }
        
            setSongResults(results);
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log("Previous search request cancelled:", error.message);
            } else {
                console.error("Error occurred during search:", error);
            }
        }
    };

    const addSong = async (platform, song) => {
        setShowModal(!showModal);

        let song_id = null;

        // Create the song in the local DB if it doesn't exist, and get the song_id
        if (platform !== 'local') {
            const response = await axios.post('/song/create', { platform: platform, song: song });
            if (response.data.status === 'success') {
                song_id = response.data.data.song_id;
            } else {
                alert('Error adding song: ' + response.data.message || 'An error occurred');
                return;
            }
        } else {
            song_id = song.song_id;
        }

        // Add the song to the playlist
        const response = await axios.get('/pl/add-song/'+pl_id+'/'+song_id);
        if (response.data.status === 'success') {
            alert(response.data.message);
            fetchSongs();
        } else {
            alert('Error adding song: ' + response.data.message || 'An error occurred');
        }
    }

    const removeSong = async (song_id) => {
        const response = await axios.get('/pl/remove-song/'+pl_id+'/'+song_id);
        if (response.data.status === 'success') {
            alert(response.data.message);
            fetchSongs();
        } else {
            alert('Error removing song: ' + response.data.message || 'An error occurred');
        }
    }

    // Toggle the new playlist modal
    const toggleModal = () => {
        setShowModal(!showModal);
    };

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f5f5f5' }}>
                <button onClick={() => navigate('/home')}>Back to Home</button>
                <button onClick={toggleModal}>Add a song</button>
                <button onClick={handleLogout}>Logout</button>
            </header>

            {showModal && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black' }}>
                    <h2>Add a song</h2>
                    <input type="text" onChange={search} placeholder="Search for a song" /><br />
                    { /*results table*/ }
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
                                        <button onClick={() => addSong("local", song)}>Add</button>
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
                                        <button onClick={() => addSong("spotify", song)}>Add from Spotify</button>
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
                                        <button onClick={() => addSong("youtube", song)}>Add from Youtube</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <br />
                    
                    <button onClick={toggleModal}>Close</button>
                </div>
            )}

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
                                  <td>{song.spotify_status}</td>
                                  <td>{song.youtube_status}</td>
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
