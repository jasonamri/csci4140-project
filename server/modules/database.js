const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

class Database {
  static pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  static async test() {
    try {
      console.log('Connecting to database...');
      const client = await this.pool.connect();
      this.status = true;
      console.log('Database connection successful');
      client.release();
    } catch (err) {
      this.status = false;
      console.log(`Database connection error: ${err}`);
      console.log("Database connection url: ", process.env.DATABASE_URL)
    }
  }

  static async query(query) {
    const client = await this.pool.connect();
    const res = await client.query(query)
      .catch(err => console.log(`Database query error: ${err}`));
    client.release();
    return res;
  }

  static async init() {
    // Connect to database
    const client = await this.pool.connect();

    // Create extension
    await this.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // DEBUG: Drop all tables
    // await this.query('DROP TABLE IF EXISTS Users, Playlists, Songs;');

    // Create Users table
    const usersTable = `CREATE TABLE IF NOT EXISTS Users (
        username VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        salt BYTEA NOT NULL,
        hashed_password BYTEA NOT NULL,
        spotify_status VARCHAR(50) CHECK (spotify_status IN ('LINKED', 'UNLINKED')),
        spotify_access_token TEXT,
        spotify_refresh_token TEXT,
        youtube_status VARCHAR(50) CHECK (youtube_status IN ('LINKED', 'UNLINKED')),
        youtube_access_token TEXT,
        youtube_refresh_token TEXT,
        date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        date_last_login TIMESTAMP WITH TIME ZONE
    );`;
    await this.query(usersTable);

    // Create Playlists table
    const playlistsTable = `CREATE TABLE IF NOT EXISTS Playlists (
        pl_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        owner VARCHAR(255) REFERENCES Users(username) ON DELETE CASCADE,
        privacy VARCHAR(50) CHECK (privacy IN ('PRIVATE', 'SHARED')),
        songs UUID[] NOT NULL,
        ordered_songs_id UUID[] NOT NULL,
        spotify_status VARCHAR(50) CHECK (spotify_status IN ('LINKED', 'LINKED_MODIFIED', 'NOT_LINKED')),
        spotify_ref TEXT,
        youtube_status VARCHAR(50) CHECK (youtube_status IN ('LINKED', 'LINKED_MODIFIED', 'NOT_LINKED')),
        youtube_ref TEXT,
        creation_type VARCHAR(50) CHECK (creation_type IN ('IMPORT', 'ACTION', 'BLANK', 'GENERATED')),
        date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        date_last_modified TIMESTAMP WITH TIME ZONE
    );`;
    await this.query(playlistsTable);

    // Create Songs table
    const songsTable = `CREATE TABLE IF NOT EXISTS Songs (
        song_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        album VARCHAR(255),
        duration INT NOT NULL,
        spotify_status VARCHAR(50) CHECK (spotify_status IN ('HARD_MATCH', 'SOFT_MATCH', 'NOT_FOUND')),
        spotify_ref TEXT,
        youtube_status VARCHAR(50) CHECK (youtube_status IN ('HARD_MATCH', 'SOFT_MATCH', 'NOT_FOUND')),
        youtube_ref TEXT
    );`;
    await this.query(songsTable);

    // Close connection
    client.release();
  }

}

module.exports = Database;
