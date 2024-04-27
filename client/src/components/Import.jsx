import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Import = () => {
    const [platform, setPlatform] = useState('');
    const [playlists, setPlaylists] = useState([]);
    const [playlist, setPlaylist] = useState('');
    const [songs, setSongs] = useState([]);
    const [showPopup, setShowPopup] = useState("none");
    const [popupSong1, setPopupSong1] = useState({});
    const [popupSong2, setPopupSong2] = useState({});
    const [readyToImport, setReadyToImport] = useState(false);
    const navigate = useNavigate();

    const handlePlatformChange = async (event) => {
        const platform = event.target.value;
        setPlatform(platform);
        setPlaylists([]);

        const response = await axios.get(`/${platform}/get-all-pls`);
        setPlaylists(response.data.data.playlists);
    };

    const handlePlaylistChange = async (event) => {
        const playlist = playlists[event.target.value];
        playlist.idx = event.target.value;
        setPlaylist(playlist);
        setSongs([]);

        const response = await axios.post(`/${platform}/pull`, { platform_ref: playlist[`${platform}_ref`] })

        // get songs
        const songs = response.data.data.songs;
        setSongs(songs);

        for (let song of response.data.data.songs) {
            console.log(song)
            console.log({ platform: platform, platform_ref: song[`${platform}_ref`] })
            axios.post('/song/precreate', { platform: platform, platform_ref: song[`${platform}_ref`] }).then((response) => {
                // update song
                song.precreateResult = response;
                console.log(song.precreateResult)
                setSongs([...songs]);
                checkReadyToImport();
            });
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

    const runMergeVerification = async (song) => {
        const song1 = song.precreateResult.data.song;
        const song2 = song.precreateResult.data.match;
        const result = await mergeVerification(song1, song2);
        song.mergeResult = result;
        setSongs([...songs]);
    }

    const checkReadyToImport = () => {
        for (let song of songs) {
            //check that all songs have been precreated
            if (!song.status) {
                setReadyToImport(false);
                return;
            }

            //check that all unilateral matches have a merge set
            if (song.status == "soft_match_unilateral" && !song.merge) {
                setReadyToImport(false);
                return;
            }
        }
        setReadyToImport(true);
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
        const createPlaylist = async (name, songs = []) => {
            const createResponse = await axios.post('/pl/create', { name: name, creation_type: 'IMPORT', songs: songs, platform: platform, platform_ref: playlist[`${platform}_ref`] });
            if (createResponse.data.status !== 'success') {
                alert('Error creating playlist: ' + createResponse.data.message || 'An error occurred');
                return null;
            }
            return createResponse.data.data.playlist;
        }

        // create songs
        for (let song of songs) {
            const createdSong = await postcreate(song);
            if (!createdSong) {
                return;
            }
            song.song_id = createdSong.song_id;
        }


        // create playlist
        const playlist_name = playlist.name;
        const song_ids = songs.map(song => song.song_id);
        const createdPlaylist = await createPlaylist(playlist_name, song_ids);

        // redirect to playlist
        alert('Playlist created, redirecting: ' + createdPlaylist.name);
        navigate('/playlist?pl_id=' + createdPlaylist.pl_id);
    }

    return (
        <div>
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
                <select id="platform" value={platform} onChange={handlePlatformChange}>
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
                    <select id="playlist" value={playlist.idx} onChange={handlePlaylistChange}>
                        <option value="">Select Playlist</option>
                        {playlists.map((playlist, idx) => {
                            return <option key={idx} value={idx} >
                                {playlist.name}
                            </option>
                        })}
                    </select>
                </div>
            )
            }

            {
                playlist && songs.length === 0 && (
                    <span>Loading songs...</span>
                )
            }

            {
                songs.length > 0 && (
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
                                            song.precreateResult.data.status == 'soft_match_unilateral' ? (
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
            <button onClick={runImport} disabled={!readyToImport}>Import</button>


        </div >
    );
};

export default Import;
