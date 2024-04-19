import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { spotify__get_all_pls } from '../actions/spotifyActions';

function SpotifyPlaylists({ playlists, spotify__get_all_pls }) {
    useEffect(() => {
      spotify__get_all_pls();
    }, [spotify__get_all_pls]);

    return (
        <div>
            <h1>My Spotify Playlists</h1>
            <ul>
                {playlists.map(playlist => (
                    <li key={playlist.id}>{playlist.name}</li>
                ))}
            </ul>
        </div>
    );
}

const mapStateToProps = state => ({
    playlists: state.spotify.playlists
});

const mapDispatchToProps = {
  spotify__get_all_pls
};

export default connect(mapStateToProps, mapDispatchToProps)(SpotifyPlaylists);
