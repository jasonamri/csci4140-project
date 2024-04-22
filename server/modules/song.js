const Database = require('./database');
const Spotify = require('./spotify');
const Youtube = require('./youtube');

class Songs {
    /*static async get(song_id) {
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
    }*/

    static async search(spotify_access_token, youtube_access_token, query, count) {
        // search local DB using tsquery
        const formattedQuery = query.trim().split(' ').join(' | ');
        const searchQuery = {
            text: `SELECT * FROM songs WHERE search_vector @@ to_tsquery($1) ORDER BY ts_rank(search_vector, to_tsquery($1)) DESC LIMIT $2`,
            values: [formattedQuery, count]
        };
        const local_results = await Database.query(searchQuery);

        // search spotify
        const spotify_results = await Spotify.search(spotify_access_token, query, count);

        // search youtube
        const youtube_results = await Youtube.search(youtube_access_token, query, count);

        return {
            status: 'success',
            data: {
                local: local_results.rows,
                spotify: spotify_results,
                youtube: youtube_results
            }
        }
    }

    static async precreate(spotify_access_token, youtube_access_token, primary_platform, primary_platform_ref) {
        const hard_match = (platform, platform_ref) => {
            const query = {
                text: 'SELECT * FROM songs WHERE ' + platform + '_status = \'HARD_MATCH\' AND ' + platform + '_ref = $1',
                values: [platform_ref]
            };
            return Database.query(query);
        }

        const soft_match = (platform, platform_ref) => {
            const query = {
                text: 'SELECT * FROM songs WHERE ' + platform + '_status = \'SOFT_MATCH\' AND ' + platform + '_ref = $1',
                values: [platform_ref]
            };
            return Database.query(query);
        }


        // check if platform is valid
        if (primary_platform !== 'spotify' && primary_platform !== 'youtube') {
            return {
                status: 'fail',
                message: 'Invalid platform'
            }
        }

        // check if song already exists in database
        let song = null;
        const res = await hard_match(primary_platform, primary_platform_ref);
        if (res.rows.length > 0) {
            song = res.rows[0];
            return { // TESTED
                status: 'exists',
                message: 'Song already exists in database (case 0)',
                data: {
                    song: song
                }
            }
        }

        // pull song from platform
        if (primary_platform === 'spotify') {
            song = await Spotify.getSong(spotify_access_token, primary_platform_ref);
        } else if (primary_platform === 'youtube') {
            song = await Youtube.getSong(youtube_access_token, primary_platform_ref);
        }

        const secondary_platform = primary_platform === 'spotify' ? 'youtube' : 'spotify';
        let secondary_platform_ref = null;

        // TODO: Improve soft match logic
        // search for soft matches on secondary platform
        let outbound_soft_match_available = false;
        if (secondary_platform === 'spotify') {
            const search_results = await Spotify.search(spotify_access_token, song.title + ' ' + song.artist, 1);
            if (search_results.length > 0) {
                secondary_platform_ref = search_results[0].spotify_ref;
                outbound_soft_match_available = true;
                console.log('outbound soft match available', secondary_platform, secondary_platform_ref);
            }
        } else if (secondary_platform === 'youtube') {
            const search_results = await Youtube.search(youtube_access_token, song.title + ' ' + song.artist, 1);
            if (search_results.length > 0) {
                secondary_platform_ref = search_results[0].youtube_ref;
                outbound_soft_match_available = true;
                console.log('outbound soft match available', secondary_platform, secondary_platform_ref);
            }
        }

        // cross compare soft-matches
        if (!outbound_soft_match_available) { // no outbound soft match available
            // check for inbound soft matches
            const inboundRes = await soft_match(primary_platform, primary_platform_ref);

            if (inboundRes.rows.length > 0) {
                return {
                    status: 'soft_match_unilateral',
                    message: 'Soft match available (case 1)',
                    data: {
                        song: song,
                        match: inboundRes.rows[0]
                    }
                }
            } else {
                return {
                    status: 'no_match',
                    message: 'No matches available (case 2)',
                    data: {
                        song: song
                    }
                }
            }
        } else { // outbound soft match available
            // check for outbound soft matches
            const outboundRes = await hard_match(secondary_platform, secondary_platform_ref);

            // check for inbound soft matches
            const inboundRes = await soft_match(primary_platform, primary_platform_ref);

            if (outboundRes.rows.length > 0 && inboundRes.rows.length > 0) {
                // check for mutual match
                if (outboundRes.rows[0].id === inboundRes.rows[0].id) {
                    return {
                        status: 'soft_match_bilateral',
                        message: 'Mutual match available (case 3)',
                        data: {
                            song: song,
                            match: outboundRes.rows[0],
                            soft_match_ref: secondary_platform_ref
                        }
                    }
                } else {
                    return {
                        status: 'soft_match_unilateral',
                        message: 'Soft match available (case 4)',
                        data: {
                            song: song,
                            match: outboundRes.rows[0],
                            soft_match_ref: secondary_platform_ref
                        }
                    }
                }
            } else if (outboundRes.rows.length > 0) {
                return { // TESTED
                    status: 'soft_match_unilateral',
                    message: 'Soft match available (case 5)',
                    data: {
                        song: song,
                        match: outboundRes.rows[0],
                        soft_match_ref: secondary_platform_ref
                    }
                }
            } else if (inboundRes.rows.length > 0) {
                return {
                    status: 'soft_match_unilateral',
                    message: 'Soft match available (case 6)',
                    data: {
                        song: song,
                        match: inboundRes.rows[0],
                        soft_match_ref: secondary_platform_ref
                    }
                }
            } else {
                return { // TESTED
                    status: 'no_match',
                    message: 'No matches available (case 7)',
                    data: {
                        song: song,
                        soft_match_ref: secondary_platform_ref
                    }
                }
            }
        }
    }

    static async create(spotify_access_token, youtube_access_token, primary_platform, primary_platform_ref, secondary_platform_ref) {
        // get song from platform
        let song = null;
        if (primary_platform === 'spotify') {
            song = await Spotify.getSong(spotify_access_token, primary_platform_ref);
        } else if (primary_platform === 'youtube') {
            song = await Youtube.getSong(youtube_access_token, primary_platform_ref);
        } else {
            return {
                status: 'fail',
                message: 'Invalid platform'
            }
        }

        // add song to database
        const query = {
            text: 'INSERT INTO songs (title, artist, album, ' + primary_platform + '_status, ' + primary_platform + '_ref) VALUES ($1, $2, $3, \'HARD_MATCH\', $4) RETURNING *',
            values: [song.title, song.artist, song.album, primary_platform_ref]
        };
        const res = await Database.query(query);
        song = res.rows[0];

        // add secondary platform ref if provided
        if (secondary_platform_ref) {
            const secondary_platform = primary_platform === 'spotify' ? 'youtube' : 'spotify';
            const updateQuery = {
                text: 'UPDATE songs SET ' + secondary_platform + '_status = \'SOFT_MATCH\', ' + secondary_platform + '_ref = $1 WHERE song_id = $2 RETURNING *',
                values: [secondary_platform_ref, song.song_id]
            };
            const updateRes = await Database.query(updateQuery);
            song = updateRes.rows[0];
        }

        return {
            status: 'success',
            data: {
                song: song
            }
        }
    }

    static async merge(song_1_id, song_2_id) {
        // get songs from database
        const song_1_query = {
            text: 'SELECT * FROM songs WHERE song_id = $1',
            values: [song_1_id]
        };
        const song_2_query = {
            text: 'SELECT * FROM songs WHERE song_id = $1',
            values: [song_2_id]
        };
        const song_1_res = await Database.query(song_1_query);
        const song_2_res = await Database.query(song_2_query);
        if (song_1_res.rows.length === 0 || song_2_res.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Song not found'
            }
        }
        const song_1 = song_1_res.rows[0];
        const song_2 = song_2_res.rows[0];

        // identify which song is the primary song (hard matched to spotify)
        let primary_song = null;
        let secondary_song = null;
        if (song_1.spotify_status === 'HARD_MATCH') {
            primary_song = song_1;
            secondary_song = song_2;
        } else if (song_2.spotify_status === 'HARD_MATCH') {
            primary_song = song_2;
            secondary_song = song_1;
        } else {
            return {
                status: 'fail',
                message: 'No primary song identified'
            }
        }

        // merge songs
        primary_song.youtube_status = 'HARD_MATCH';
        primary_song.youtube_ref = secondary_song.youtube_ref;

        // update primary song in database
        const updateQuery = {
            text: 'UPDATE songs SET youtube_status = $1, youtube_ref = $2 WHERE song_id = $3 RETURNING *',
            values: [primary_song.youtube_status, primary_song.youtube_ref, primary_song.song_id]
        };
        const updateRes = await Database.query(updateQuery);
        primary_song = updateRes.rows[0];

        // delete secondary song from database
        const deleteQuery = {
            text: 'DELETE FROM songs WHERE song_id = $1',
            values: [secondary_song.song_id]
        };
        await Database.query(deleteQuery);

        // replace secondary song in all playlists with primary song (remove if duplicate)
        const replaceQuery = {
            text: 'UPDATE playlists SET songs = array_replace(songs, $1, $2) WHERE $1 = ANY(songs)',
            values: [secondary_song.song_id, primary_song.song_id]
        }
        await Database.query(replaceQuery);

        return {
            status: 'success',
            message: 'Songs merged successfully',
            data: {
                song: primary_song
            }
        }
    }

    static async link(spotify_access_token, song_id, platform, platform_ref) {
        const hard_match = (platform, platform_ref) => {
            const query = {
                text: 'SELECT * FROM songs WHERE ' + platform + '_status = \'HARD_MATCH\' AND ' + platform + '_ref = $1',
                values: [platform_ref]
            };
            return Database.query(query);
        }

        // check for hard match, if so, need to merge
        const matchRes = await hard_match(platform, platform_ref);
        if (matchRes.rows.length > 0) {
            const song_1_id = song_id;
            const song_2_id = matchRes.rows[0].song_id;
            return await this.merge(song_1_id, song_2_id);
        }

        // otherwise, can just link
        let song = null;
        const query = {
            text: 'UPDATE songs SET ' + platform + '_status = \'HARD_MATCH\', ' + platform + '_ref = $1 WHERE song_id = $2 RETURNING *',
            values: [platform_ref, song_id]
        };
        const linkRes = await Database.query(query);
        if (linkRes.rows.length === 0) {
            return {
                status: 'fail',
                message: 'Song not found'
            }
        }
        song = linkRes.rows[0];

        // if linking to spotify, update song parameters
        if (platform === 'spotify') {
            song = await Spotify.getSong(spotify_access_token, platform_ref);
            const updateQuery = {
                text: 'UPDATE songs SET title = $1, artist = $2, album = $3 WHERE song_id = $4 RETURNING *',
                values: [song.title, song.artist, song.album, song_id]
            };
            const updateRes = await Database.query(updateQuery);
            song = updateRes.rows[0];
        }

        return {
            status: 'success',
            message: 'Song linked successfully',
            data: {
                song: song
            }
        }
    }
}

module.exports = Songs;
