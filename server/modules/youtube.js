const { google } = require('googleapis');
const dotenv = require('dotenv');
const Database = require('./database');

dotenv.config();

const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtubepartner'
];

// Helper functions
function videoToSong(video) {
    return {
        youtube_ref: (video.id.videoId || video.contentDetails.videoId || video.id),
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        album: "",
        image: video.snippet.thumbnails.default.url
    }
}

function playlistToPlaylist(playlist) {
    return {
        youtube_ref: playlist.id,
        name: playlist.snippet.title
    }
}

class Youtube {
    static oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        'http://localhost:3000/callback-youtube'
    );


    static api(access_token) {
        this.oauth2Client.setCredentials({ access_token });
        return google.youtube({ version: 'v3', auth: this.oauth2Client });
    }

    static getAuthorizeURL() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });
    }

    static async link(username, code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        const { access_token, refresh_token, expiry_date } = tokens;
        const token_expiry = new Date(expiry_date).toISOString();

        // store tokens to database
        const query = `UPDATE users SET youtube_access_token = '${access_token}', youtube_refresh_token = '${refresh_token}', youtube_token_expires = '${token_expiry}', youtube_status = 'LINKED' WHERE username = '${username}'`;
        await Database.query(query);

        return {
            status: 'success',
            message: 'Youtube account linked successfully',
            data: {
                access_token: access_token,
                refresh_token: refresh_token,
                token_expiry: token_expiry
            }
        }
    }

    static async unlink(username) {
        // clear tokens from database
        const query = `UPDATE users SET youtube_access_token = NULL, youtube_refresh_token = NULL, youtube_token_expires = NULL, youtube_status = 'UNLINKED' WHERE username = '${username}'`;
        await Database.query(query);

        return {
            status: 'success',
            message: 'Youtube account unlinked successfully'
        }
    }

    static async refreshAccessToken(username, refresh_token) {
        this.oauth2Client.setCredentials({ refresh_token });
        const result = await this.oauth2Client.refreshAccessToken();
        const { access_token, expiry_date } = result.credentials;
        const token_expiry = new Date(expiry_date).toISOString();

        // store tokens to database
        const query = `UPDATE users SET youtube_access_token = '${access_token}', youtube_token_expires = '${token_expiry}' WHERE username = '${username}'`;
        await Database.query(query);

        return {
            status: 'success',
            message: 'Youtube access token refreshed successfully',
            data: {
                access_token: access_token,
                token_expiry: token_expiry
            }
        }
    }

    static async getPlaylists(access_token) {
        const response = await this.api(access_token).playlists.list({ part: 'snippet', mine: true });
        const playlists = response.data.items.map(playlistToPlaylist);
        return playlists;
    }

    static async getSong(access_token, youtube_ref) {
        const video = await this.api(access_token).videos.list({ part: 'snippet', id: youtube_ref });
        const song = videoToSong(video.data.items[0]);
        return song;
    }

    static async search(access_token, search_query, count) {
        const results = await this.api(access_token).search.list({ part: 'snippet', q: search_query, maxResults: count });
        const videos = results.data.items
        const songs = videos.map(videoToSong);

        // filter out songs already in database
        /*
        const query = {
            text: 'SELECT * FROM songs WHERE youtube_ref = ANY($1)',
            values: [songs.map(song => song.youtube_ref)]
        };
        const res = await Database.query(query);
        const youtube_refs = res.rows.map(row => row.youtube_ref);

        return songs.filter(song => !youtube_refs.includes(song.youtube_ref));
        */
        return songs;
    }

    static async pull(access_token, youtube_ref) {
        // pulls all songs from a playlist
        const response = await this.api(access_token).playlistItems.list({ part: 'snippet, contentDetails', playlistId: youtube_ref });
        const videos = response.data.items;
        const songs = videos.map(videoToSong);
        return songs;
    }

}

module.exports = Youtube;
