const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');

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
            redirectUri: 'http://localhost:8080/api/spotify/callback'
        });
    }

    getAuthorizeURL() {
        return this.spotifyApi.createAuthorizeURL(scopes);
    }

    async getAccessToken(code) {
        const data = await this.spotifyApi.authorizationCodeGrant(code);
        this.spotifyApi.setAccessToken(data.body['access_token']);
        this.spotifyApi.setRefreshToken(data.body['refresh_token']);
    }

    async getPlaylists() {
        const data = await this.spotifyApi.getUserPlaylists();
        return data.body.items;
    }

}

module.exports = Spotify;
