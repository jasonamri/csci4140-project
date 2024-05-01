const Database = require('./database');

class Playlists {
    static async create(username, name, creation_type, songs, platform, platform_ref) {
        // add playlist to database
        let playlist = null
        const query = {
            text: 'INSERT INTO playlists (owner, name, creation_type, songs) VALUES ($1, $2, $3, $4) RETURNING *',
            values: [username, name, creation_type, songs]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Failed to create playlist'
            }
        }
        playlist = res.rows[0];

        // add platform_ref if provided
        if (platform && platform_ref) {
            const updateQuery = {
                text: 'UPDATE playlists SET ' + platform + '_status = \'LINKED\', ' + platform + '_ref = $1 WHERE pl_id = $2 RETURNING *',
                values: [platform_ref, playlist.pl_id]
            };
            const updateRes = await Database.query(updateQuery);
            playlist = updateRes.rows[0];
        }

        return {
            status: 'success',
            message: 'Playlist created successfully',
            data: {
                playlist: playlist
            }
        }
    }

    static async delete(username, pl_id) {
        // delete playlist
        const query = {
            text: 'DELETE FROM playlists WHERE owner = $1 AND pl_id = $2 RETURNING *',
            values: [username, pl_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }
        return {
            status: 'success',
            message: 'Playlist deleted'
        }
    }

    static async pull(username, pl_id, songs, platform) {
        // update songs
        let playlist = null;
        const query = {
            text: 'UPDATE playlists SET songs = $1 WHERE owner = $2 AND pl_id = $3 RETURNING *',
            values: [songs, username, pl_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }
        playlist = res.rows[0];

        // change from LINKED_MODIFIED to LINKED
        const spotify_status = res.rows[0].spotify_status;
        const youtube_status = res.rows[0].youtube_status;
        let updateQuery = null;
        if (platform === 'spotify') {
            if (youtube_status === 'LINKED') {
                updateQuery = {
                    text: 'UPDATE playlists SET spotify_status = \'LINKED\', youtube_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND pl_id = $2 RETURNING *',
                    values: [username, pl_id]
                };
            } else {
                updateQuery = {
                    text: 'UPDATE playlists SET spotify_status = \'LINKED\' WHERE owner = $1 AND pl_id = $2 RETURNING *',
                    values: [username, pl_id]
                };
            }
        } else if (platform === 'youtube') {
            if (spotify_status === 'LINKED') {
                updateQuery = {
                    text: 'UPDATE playlists SET spotify_status = \'LINKED_MODIFIED\', youtube_status = \'LINKED\' WHERE owner = $1 AND pl_id = $2 RETURNING *',
                    values: [username, pl_id]
                }
            } else {
                updateQuery = {
                    text: 'UPDATE playlists SET youtube_status = \'LINKED\' WHERE owner = $1 AND pl_id = $2 RETURNING *',
                    values: [username, pl_id]
                };
            }
        } else {
            return {
                status: 'fail',
                message: 'Invalid platform'
            }
        }
        const updateRes = await Database.query(updateQuery);
        playlist = updateRes.rows[0];

        return {
            status: 'success',
            message: 'Playlist updated successfully',
            data: {
                playlist: playlist
            }
        }
    }

    static async push(username, pl_id, platform, platform_ref) {
        let query = null;
        if (platform_ref) {
            // Link playlist
            query = {
                text: 'UPDATE playlists SET ' + platform + '_status = \'LINKED\', ' + platform + '_ref = $1 WHERE owner = $2 AND pl_id = $3 RETURNING *',
                values: [platform_ref, username, pl_id]
            }
        } else {
            // change from LINKED_MODIFIED to LINKED
            query = {
                text: 'UPDATE playlists SET ' + platform + '_status = \'LINKED\' WHERE owner = $1 AND pl_id = $2 RETURNING *',
                values: [username, pl_id]
            };
        }
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }
        return {
            status: 'success',
            message: 'Playlist updated successfully',
            data: {
                playlist: res.rows[0]
            }
        }
    }

    static async get(username, pl_id) {
        const query = {
            text: 'SELECT * FROM playlists WHERE (owner = $1 OR privacy = \'SHARED\') AND pl_id = $2',
            values: [username, pl_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }
        return {
            status: 'success',
            data: {
                playlist: res.rows[0]
            }
        }
    }

    static async getAll(username) {
        const query = {
            text: 'SELECT * FROM playlists WHERE owner = $1',
            values: [username]
        };
        const res = await Database.query(query);
        return {
            status: 'success',
            data: {
                playlists: res.rows
            }
        }
    }

    static async getSongs(username, pl_id) {
        const query = {
            text: 'SELECT songs FROM playlists WHERE (owner = $1 OR privacy = \'SHARED\') AND pl_id = $2',
            values: [username, pl_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }

        const song_ids = res.rows[0].songs;
        const songs = await Database.query({
            text: 'SELECT * FROM songs WHERE song_id = ANY($1)',
            values: [song_ids]
        });
        return {
            status: 'success',
            data: {
                songs: songs.rows
            }
        }
    }

    static async share(username, pl_id) {
        // get current privacy
        let playlist = null;
        const query = {
            text: 'SELECT * FROM playlists WHERE owner = $1 AND pl_id = $2',
            values: [username, pl_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }
        playlist = res.rows[0];

        // update privacy
        const newPrivacy = playlist.privacy === 'PRIVATE' ? 'SHARED' : 'PRIVATE';
        const updateRes = await Database.query({
            text: 'UPDATE playlists SET privacy = $1 WHERE owner = $2 AND pl_id = $3 RETURNING *',
            values: [newPrivacy, username, pl_id]
        });
        if (updateRes.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Failed to update playlist'
            }
        }
        playlist = updateRes.rows[0];

        return {
            status: 'success',
            message: 'Playlist sharing set to ' + newPrivacy,
            data: {
                playlist: playlist
            }
        }
    }

    static async addSong(username, pl_id, song_id) {
        // check if song is already in playlist
        const query = {
            text: 'SELECT * FROM playlists WHERE owner = $1 AND pl_id = $2 AND $3 = ANY(songs)',
            values: [username, pl_id, song_id]
        };
        const res = await Database.query(query);
        if (res.rows.length > 0) {
            return {
                status: 'fail',
                message: 'Song already in playlist'
            }
        }

        // add song to playlist
        const res2 = await Database.query({
            text: 'UPDATE playlists SET songs = array_append(songs, $1) WHERE owner = $2 AND pl_id = $3 RETURNING *',
            values: [song_id, username, pl_id]
        });
        if (res2.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }

        // change from LINKED to LINKED_MODIFIED
        const spotify_status = res2.rows[0].spotify_status;
        const youtube_status = res2.rows[0].youtube_status;
        if (spotify_status === 'LINKED') {
            await Database.query({
                text: 'UPDATE playlists SET spotify_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND pl_id = $2',
                values: [username, pl_id]
            });
        }
        if (youtube_status === 'LINKED') {
            await Database.query({
                text: 'UPDATE playlists SET youtube_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND pl_id = $2',
                values: [username, pl_id]
            });
        }

        return {
            status: 'success',
            message: 'Song added to playlist'
        }
    }

    static async removeSong(username, pl_id, song_id) {
        // remove song from playlist
        const res = await Database.query({
            text: 'UPDATE playlists SET songs = array_remove(songs, $1) WHERE owner = $2 AND pl_id = $3 RETURNING *',
            values: [song_id, username, pl_id]
        });
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found or song not in playlist'
            }
        }

        // change from LINKED to LINKED_MODIFIED
        const spotify_status = res.rows[0].spotify_status;
        const youtube_status = res.rows[0].youtube_status;
        if (spotify_status === 'LINKED') {
            await Database.query({
                text: 'UPDATE playlists SET spotify_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND pl_id = $2',
                values: [username, pl_id]
            });
        }
        if (youtube_status === 'LINKED') {
            await Database.query({
                text: 'UPDATE playlists SET youtube_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND pl_id = $2',
                values: [username, pl_id]
            });
        }

        return {
            status: 'success',
            message: 'Song removed from playlist'
        }
    }
}

module.exports = Playlists;
