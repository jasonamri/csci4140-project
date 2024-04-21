const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const Database = require('./database');

dotenv.config();

const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-library-modify',
    'user-top-read',
    'user-read-recently-played',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-follow-read',
    'user-follow-modify',
    'user-read-playback-position'
];

// Helper functions
function trackToSong(track) {
    return {
        spotify_ref: track.id,
        title: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        //duration: track.duration_ms,
        image: track.album.images[0].url
    }
}

class Spotify {

    static spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: 'http://localhost:3000/callback-spotify'
    });


    static api(access_token) {
        this.spotifyApi.setAccessToken(access_token);
        return this.spotifyApi;
    }

    static getAuthorizeURL() {
        return this.spotifyApi.createAuthorizeURL(scopes);
    }

    static async link(username, code) {
        const data = await this.spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token, expires_in } = data.body;
        const token_expiry = new Date(Date.now() + expires_in * 1000).toISOString();

        // store tokens to database
        const query = `UPDATE users SET spotify_access_token = '${access_token}', spotify_refresh_token = '${refresh_token}', spotify_token_expires = '${token_expiry}', spotify_status = 'LINKED' WHERE username = '${username}'`;
        await Database.query(query);

        return {
            status: 'success',
            message: 'Spotify account linked successfully',
            data: {
                access_token: access_token,
                refresh_token: refresh_token,
                token_expiry: token_expiry
            }
        }
    }

    static async unlink(username) {
        // clear tokens from database
        const query = `UPDATE users SET spotify_access_token = NULL, spotify_refresh_token = NULL, spotify_token_expires = NULL, spotify_status = 'UNLINKED' WHERE username = '${username}'`;
        await Database.query(query);

        return {
            status: 'success',
            message: 'Spotify account unlinked successfully'
        }
    }

    static async refreshAccessToken(username, refresh_token) {
        this.spotifyApi.setRefreshToken(refresh_token);
        const data = await this.spotifyApi.refreshAccessToken();
        const { access_token, expires_in } = data.body;
        const token_expiry = new Date(Date.now() + expires_in * 1000).toISOString();

        // store tokens to database
        const query = `UPDATE users SET spotify_access_token = '${access_token}', spotify_token_expires = '${token_expiry}' WHERE username = '${username}'`;
        await Database.query(query);

        return {
            status: 'success',
            message: 'Spotify ccess token refreshed successfully',
            data: {
                access_token: access_token,
                token_expiry: token_expiry
            }
        }
    }

    static async getPlaylists(access_token) {
        const data = await this.api(access_token).getUserPlaylists();
        return data.body.items;
    }

    static async getSong(access_token, spotify_ref) {
        const track = await this.api(access_token).getTrack(spotify_ref);
        const song = trackToSong(track.body);
        return song;
    }

    static async search(access_token, search_query, count) {
        const results = await this.api(access_token).searchTracks(search_query, { limit: count });
        const tracks = results.body.tracks.items
        const songs = tracks.map(trackToSong);

        // filter out songs already in database
        const query = {
            text: 'SELECT * FROM songs WHERE spotify_ref = ANY($1)',
            values: [songs.map(song => song.spotify_ref)]
        };
        const res = await Database.query(query);
        const spotify_refs = res.rows.map(row => row.spotify_ref);

        return songs.filter(song => !spotify_refs.includes(song.spotify_ref));
    }

}

module.exports = Spotify;
