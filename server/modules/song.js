const Database = require('./database');

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

    // TODO: rest of the methods

}

module.exports = Songs;
