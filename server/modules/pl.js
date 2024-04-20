const Database = require('./database');

class Playlists {
    static async create(username, name, creation_type, songs) {
        const query = {
            text: 'INSERT INTO playlists (owner, name, creation_type, songs) VALUES ($1, $2, $3, $4) RETURNING *',
            values: [username, name, creation_type, songs]
        };
        const res = await Database.query(query);
        return {
            status: 'success',
            message: 'Playlist created',
            data: res.rows[0]
        }
    }

    static async get(username, pl_id) {
        const query = {
            text: 'SELECT * FROM playlists WHERE owner = $1 AND id = $2',
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
            data: res.rows[0]
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
            data: res.rows
        }
    }

    static async getSongs(username, pl_id) {
        const query = {
            text: 'SELECT songs FROM playlists WHERE owner = $1 AND id = $2',
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
            data: songs.rows
        }
    }

    static async share(username, pl_id) {
        // get current privacy
        const query = {
            text: 'SELECT privacy FROM playlists WHERE owner = $1 AND id = $2',
            values: [username, pl_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }

        // update privacy
        const privacy = res.rows[0].privacy === 'PRIVATE' ? 'SHARED' : 'PRIVATE';
        await Database.query({
            text: 'UPDATE playlists SET privacy = $1 WHERE owner = $2 AND id = $3 RETURNING *',
            values: [privacy, username, pl_id]
        });
        return {
            status: 'success',
            message: 'Playlist shared',
            data: res.rows[0]
        }
    }

    static async addSong(username, pl_id, song_id) {
        // get link statuses
        const query = {
            text: 'SELECT spotify_status, youtube_status FROM playlists WHERE owner = $1 AND id = $2',
            values: [username, pl_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Playlist not found'
            }
        }

        // add song to playlist
        await Database.query({
            text: 'UPDATE playlists SET songs = array_append(songs, $1) WHERE owner = $2 AND id = $3 RETURNING *',
            values: [song_id, username, pl_id]
        });

        // change from LINKED to LINKED_MODIFIED
        const spotify_status = res.rows[0].spotify_status;
        const youtube_status = res.rows[0].youtube_status;
        if (spotify_status === 'LINKED') {
            await Database.query({
                text: 'UPDATE playlists SET spotify_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND id = $2',
                values: [username, pl_id]
            });
        }
        if (youtube_status === 'LINKED') {
            await Database.query({
                text: 'UPDATE playlists SET youtube_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND id = $2',
                values: [username, pl_id]
            });
        }

        return {
            status: 'success',
            message: 'Song added to playlist'
        }
    }

    static async removeSong(username, pl_id, song_id) {
        const query = {
            text: 'UPDATE playlists SET songs = array_remove(songs, $1) WHERE owner = $2 AND id = $3 RETURNING *',
            values: [song_id, username, pl_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Song not found in playlist'
            }
        }

        // change from LINKED to LINKED_MODIFIED
        const spotify_status = res.rows[0].spotify_status;
        const youtube_status = res.rows[0].youtube_status;
        if (spotify_status === 'LINKED') {
            await Database.query({
                text: 'UPDATE playlists SET spotify_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND id = $2',
                values: [username, pl_id]
            });
        }
        if (youtube_status === 'LINKED') {
            await Database.query({
                text: 'UPDATE playlists SET youtube_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND id = $2',
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
