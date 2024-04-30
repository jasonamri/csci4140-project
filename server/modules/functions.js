const Database = require('./database');

class Functions {
    static async clone(username, pl_ids) {
        for (const pl_id of pl_ids) {
            // get playlist
            const res = await Database.query({
                text: 'SELECT * FROM playlists WHERE pl_id = $1 AND owner = $2',
                values: [pl_id, username]
            });
            if (res.rows.length < 1) {
                return {
                    status: 'fail',
                    message: `Playlist with pl_id=${pl_id} does not exist`
                };
            }
            const playlist = res.rows[0];

            // create a copy
            const createRes = await Database.query({
                text: 'INSERT INTO playlists (name, creation_type, songs, owner) VALUES ($1, $2, $3, $4) RETURNING *',
                values: ['Copy of: ' + playlist.name, 'FUNCTION', playlist.songs, username]
            });
            if (createRes.rows.length < 1) {
                return {
                    status: 'fail',
                    message: 'Failed to create copy of playlist'
                };
            }
        }
        return {
            status: 'success',
            message: 'Playlists cloned successfully'
        };
    }

    static async deduplicate(username, pl_ids) {
        // Fetch the playlists in the specified order
        const res = await Database.query({
            text: `SELECT * FROM playlists WHERE pl_id = ANY($1::uuid[]) AND owner = $2 ORDER BY array_position($1, pl_id);`,
            values: [pl_ids, username]
        });
        if (res.rows.length < pl_ids.length) {
            return {
                status: 'fail',
                message: 'One or more playlists do not exist'
            };
        }
        let playlists = res.rows;

        // Deduplicate songs across playlists
        let seenSongs = new Set();
        let updates = [];
        playlists.forEach(playlist => {
            let newSongs = playlist.songs.filter(song => {
                if (seenSongs.has(song)) {
                    return false;
                } else {
                    seenSongs.add(song);
                    return true;
                }
            });

            // Prepare update if changes were made
            if (newSongs.length !== playlist.songs.length) {
                updates.push({
                    playlist: playlist,
                    newSongs: newSongs
                });
            }
        });

        for (let update of updates) {
            // Update the playlists with deduplicated song lists
            const updateRes = await Database.query({
                text: 'UPDATE playlists SET songs = $1 WHERE pl_id = $2',
                values: [update.newSongs, update.playlist.pl_id]
            });
            if (updateRes.rowCount < 1) {
                return {
                    status: 'fail',
                    message: `Failed to update playlist with pl_id=${update.pl_id}`
                };
            }

            // change from LINKED to LINKED_MODIFIED
            const spotify_status = update.playlist.spotify_status;
            const youtube_status = update.playlist.youtube_status;
            if (spotify_status === 'LINKED') {
                await Database.query({
                    text: 'UPDATE playlists SET spotify_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND pl_id = $2',
                    values: [username, update.playlist.pl_id]
                });
            }
            if (youtube_status === 'LINKED') {
                await Database.query({
                    text: 'UPDATE playlists SET youtube_status = \'LINKED_MODIFIED\' WHERE owner = $1 AND pl_id = $2',
                    values: [username, update.playlist.pl_id]
                });
            }
        }

        return {
            status: 'success',
            message: 'Playlists deduplicated successfully'
        };
    }

    static async merge(username, pl_ids) {
        // creates a playlist with songs that are in any of the playlists

        // fetch playlists
        const res = await Database.query({
            text: 'SELECT * FROM playlists WHERE pl_id = ANY($1::uuid[]) AND owner = $2',
            values: [pl_ids, username]
        });
        if (res.rows.length < pl_ids.length) {
            return {
                status: 'fail',
                message: 'One or more playlists do not exist'
            };
        }
        let playlists = res.rows;

        // merge songs, maintaining order
        let mergedSongs = [];
        let seenSongs = new Set();
        playlists.forEach(playlist => {
            playlist.songs.forEach(song => {
                if (!seenSongs.has(song)) {
                    mergedSongs.push(song);
                    seenSongs.add(song);
                }
            });
        });

        // create new playlist
        const createRes = await Database.query({
            text: 'INSERT INTO playlists (name, creation_type, songs, owner) VALUES ($1, $2, $3, $4) RETURNING *',
            values: ['Merged Playlist', 'FUNCTION', mergedSongs, username]
        });
        if (createRes.rows.length < 1) {
            return {
                status: 'fail',
                message: 'Failed to create merged playlist'
            };
        }

        return {
            status: 'success',
            message: 'Playlists merged successfully'
        };
    }

    static async overlap(username, pl_ids) {
        // creates a playlist with songs that are in all of the playlists

        // fetch playlists
        const res = await Database.query({
            text: 'SELECT * FROM playlists WHERE pl_id = ANY($1::uuid[]) AND owner = $2',
            values: [pl_ids, username]
        });
        if (res.rows.length < pl_ids.length) {
            return {
                status: 'fail',
                message: 'One or more playlists do not exist'
            };
        }
        let playlists = res.rows;

        // overlap songs
        let overlapSongs = playlists[0].songs;
        playlists.forEach(playlist => {
            let playlistSongs = new Set(playlist.songs);
            overlapSongs = overlapSongs.filter(song => playlistSongs.has(song));
        });

        // create new playlist
        const createRes = await Database.query({
            text: 'INSERT INTO playlists (name, creation_type, songs, owner) VALUES ($1, $2, $3, $4) RETURNING *',
            values: ['Overlapping Playlist', 'FUNCTION', overlapSongs, username]
        });
        if (createRes.rows.length < 1) {
            return {
                status: 'fail',
                message: 'Failed to create overlapping playlist'
            };
        }

        return {
            status: 'success',
            message: 'Playlists overlapped successfully'
        };
    }
}

module.exports = Functions;
