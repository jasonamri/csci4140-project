const { google } = require('googleapis');
const dotenv = require('dotenv');

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
            'http://localhost:8080/api/youtube/callback'
        );
    }

    getAuthorizeURL() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });
    }

    async getAccessToken(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        this.youtubeApi = google.youtube({
            version: 'v3',
            auth: this.oauth2Client,
        });
    }

    async getPlaylists() {
        const response = await this.youtubeApi.playlists.list({
            part: 'snippet,contentDetails',
            mine: true,
            maxResults: 25
          });
        return response.data;
    }

}

module.exports = Youtube;
