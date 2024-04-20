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

class Spotify {
    constructor() {
        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: 'http://localhost:3000/callback-spotify'
        });
    }

    getAuthorizeURL() {
        return this.spotifyApi.createAuthorizeURL(scopes);
    }

    async link(username, code) {
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

    async unlink(username) {
        // clear tokens from database
        const query = `UPDATE users SET spotify_access_token = NULL, spotify_refresh_token = NULL, spotify_token_expires = NULL, spotify_status = 'UNLINKED' WHERE username = '${username}'`;
        await Database.query(query);

        return {
            status: 'success',
            message: 'Spotify account unlinked successfully'
        }
    }

    async refreshAccessToken(username, refresh_token) {
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


    async getPlaylists(access_token) {
        this.spotifyApi.setAccessToken(access_token);
        const data = await this.spotifyApi.getUserPlaylists();
        return data.body.items;
    }

    async search(access_token, query, count) {
        this.spotifyApi.setAccessToken(access_token);
        const results = await this.spotifyApi.searchTracks(query, { limit: count });
        
        const tracks = results.body.tracks.items.map(track => {
            return {
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                image: track.album.images[0].url,
                duration: track.duration_ms
            }
        });

        return tracks;
    }

}

module.exports = Spotify;
