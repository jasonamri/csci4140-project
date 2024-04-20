const { google } = require('googleapis');
const dotenv = require('dotenv');
const Database = require('./database');

dotenv.config();

const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly',
];

class Youtube {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            'http://localhost:3000/callback-youtube'
        );
    }

    getAuthorizeURL() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });
    }

    async link(username, code) {
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

    async unlink(username) {
        // clear tokens from database
        const query = `UPDATE users SET youtube_access_token = NULL, youtube_refresh_token = NULL, youtube_token_expires = NULL, youtube_status = 'UNLINKED' WHERE username = '${username}'`;
        await Database.query(query);

        return {
            status: 'success',
            message: 'Youtube account unlinked successfully'
        }
    }

    async refreshAccessToken(username, refresh_token) {
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

    async getPlaylists(access_token) {
        this.oauth2Client.setCredentials({ access_token });
        const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });

        const response = await youtube.playlists.list({
            part: 'snippet',
            mine: true
        });

        return response.data.items;
    }

    async search(access_token, query, count) {
        this.oauth2Client.setCredentials({ access_token });
        const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });

        const response = await youtube.search.list({
            part: 'snippet',
            q: query,
            maxResults: count
        });

        const videos = response.data.items.map(item => {
            return {
                id: item.id.videoId,
                name: item.snippet.title,
                artist: item.snippet.channelTitle,
                image: item.snippet.thumbnails.default.url
            }
        });

        return videos;
    }

}

module.exports = Youtube;
