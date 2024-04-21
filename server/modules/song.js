const Database = require('./database');
const Spotify = require('./spotify');
const Youtube = require('./youtube');

class Songs {
    static async get(song_id) {
        const query = {
            text: 'SELECT * FROM songs WHERE id = $1',
            values: [song_id]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Song not found'
            }
        }
        return {
            status: 'success',
            data: res.rows[0]
        }
    }

    static async create(platform, song) {
        // get song from platform
        let platform_ref = null;
        if (platform === 'spotify') {
            platform_ref = song.spotify_ref;
        } else if (platform === 'youtube') {
            platform_ref = song.youtube_ref;
        } else {
            return {
                status: 'fail',
                message: 'Invalid platform'
            }
        }

        const query = {
            text: 'INSERT INTO songs ('+platform+'_status, '+platform+'_ref, title, artist, album) VALUES (\'HARD_MATCH\', $1, $2, $3, $4) RETURNING *',
            values: [platform_ref, song.title, song.artist, song.album]
        };
        const res = await Database.query(query);
        return {
            status: 'success',
            data: res.rows[0]
        }

    }

    /*
    static async match(platform, platform_ref) { //still used??
        if (platform !== 'spotify' && platform !== 'youtube') {
            return {
                status: 'fail',
                message: 'Invalid platform'
            }
        }

        const query = {
            text: 'SELECT * FROM songs WHERE '+platform+'_ref = $1',
            values: [platform_ref]
        };
        const res = await Database.query(query);
        if (res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Song not found'
            }
        }
        return {
            status: 'success',
            data: res.rows[0]
        }
    }*/

    static async search(query, count) {
        // search local DB using tsquery
        const formattedQuery = query.trim().split(' ').join(' | ');
        const searchQuery = {
            text: `SELECT * FROM songs WHERE search_vector @@ to_tsquery($1) ORDER BY ts_rank(search_vector, to_tsquery($1)) DESC LIMIT $2`,
            values: [formattedQuery, count]
        };
        const searchResults = await Database.query(searchQuery);

        return {
            status: 'success',
            data: {
                results: searchResults.rows,
            }
        }
    }
}

module.exports = Songs;
