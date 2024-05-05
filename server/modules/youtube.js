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
function itemToSong(item) {
    let ref = null;
    if (item.kind === 'youtube#video') {
        ref = item.id;
    } else if (item.kind === 'youtube#searchResult') {
        ref = item.id.videoId;
    } else if (item.kind === 'youtube#playlistItem') {
        ref = item.contentDetails.videoId;
    } else {
        console.log("Youtube item kind not recognized");
        return null;
    }

    // DEBUG: console.log(ref)

    return {
        youtube_ref: ref,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        album: "",
        image: ""
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
        process.env.CALLBACK_URL + '/callback-youtube'
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

    static async createPlaylist(access_token, name) {
        const response = await this.api(access_token).playlists.insert({ part: 'snippet', resource: { snippet: { title: name } } });
        const playlist = playlistToPlaylist(response.data);
        return playlist;
    }

    static async getPlaylists(access_token) {
        const response = await this.api(access_token).playlists.list({ part: 'snippet', mine: true });
        const playlists = response.data.items.map(playlistToPlaylist);
        return playlists;
    }

    static async getSong(access_token, youtube_ref) {
        const video = await this.api(access_token).videos.list({ part: 'snippet', id: youtube_ref });
        const song = itemToSong(video.data.items[0]);
        return song;
    }

    static async search(access_token, search_query, count) {
        const results = await this.api(access_token).search.list({ part: 'snippet', q: search_query, maxResults: count });
        const videos = results.data.items
        const songs = videos.map(itemToSong);
        return songs;
    }

    static async pull(access_token, youtube_ref) {
        const response = await this.api(access_token).playlistItems.list({ part: 'snippet, contentDetails', playlistId: youtube_ref });
        const videos = response.data.items;
        const songs = videos.map(itemToSong);
        return songs;
    }

    static async push(access_token, youtube_ref, songs) {
        // get existing videos in playlist
        const response = await this.api(access_token).playlistItems.list({ part: 'snippet', playlistId: youtube_ref });
        const videos = response.data.items;

        // remove existing videos from playlist
        for (const video of videos) {
            console.log('deleting video', video.id)
            await this.api(access_token).playlistItems.delete({ id: video.id });
        }

        // add new videos to playlist
        const videoIds = songs.map(song => song.youtube_ref);
        for (const videoId of videoIds) {
            console.log('adding video', videoId)
            await this.api(access_token).playlistItems.insert({ part: 'snippet', resource: { snippet: { playlistId: youtube_ref, resourceId: { kind: 'youtube#video', videoId: videoId } } } });
        }
    }

}

module.exports = Youtube;
