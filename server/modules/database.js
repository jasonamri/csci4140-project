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
    const res = await client.query(query);
    client.release();
    return res;
  }

  static async init() {
    try {
      // Connect to database
      const client = await this.pool.connect();

      // Create extension
      await this.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

      // DEBUG: Drop all tables
      // await this.query('DROP TABLE IF EXISTS users;');
      // await this.query('DROP TABLE IF EXISTS playlists;');
      // await this.query('DROP TABLE IF EXISTS songs;');
      // await this.query('DROP TABLE IF EXISTS sessions;');

      // Create Sessions table
      const sessionsTable = `CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
    );`;
      await this.query(sessionsTable);

      // Create Users table
      const usersTable = `CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        spotify_status VARCHAR(50) DEFAULT 'UNLINKED' CHECK (spotify_status IN ('LINKED', 'UNLINKED')),
        spotify_access_token TEXT,
        spotify_refresh_token TEXT,
        spotify_token_expires TIMESTAMP WITH TIME ZONE,
        youtube_status VARCHAR(50) DEFAULT 'UNLINKED' CHECK (youtube_status IN ('LINKED', 'UNLINKED')),
        youtube_access_token TEXT,
        youtube_refresh_token TEXT,
        youtube_token_expires TIMESTAMP WITH TIME ZONE,
        date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        date_last_login TIMESTAMP WITH TIME ZONE
    );`;
      await this.query(usersTable);

      // Add indexes for Users table (for performance)
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_spotify_status ON users(spotify_status);');
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_youtube_status ON users(youtube_status);');

      // Create Playlists table
      const playlistsTable = `CREATE TABLE IF NOT EXISTS playlists (
          pl_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          owner VARCHAR(255) REFERENCES Users(username) ON DELETE CASCADE,
          privacy VARCHAR(50) DEFAULT 'PRIVATE' CHECK (privacy IN ('PRIVATE', 'SHARED')),
          songs UUID[] NOT NULL,
          spotify_status VARCHAR(50) DEFAULT 'NOT_LINKED' CHECK (spotify_status IN ('LINKED', 'LINKED_MODIFIED', 'NOT_LINKED')),
          spotify_ref TEXT,
          youtube_status VARCHAR(50) DEFAULT 'NOT_LINKED' CHECK (youtube_status IN ('LINKED', 'LINKED_MODIFIED', 'NOT_LINKED')),
          youtube_ref TEXT,
          creation_type VARCHAR(50) CHECK (creation_type IN ('IMPORT', 'FUNCTION', 'BLANK', 'GENERATED', 'SHARED')),
          date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          date_last_modified TIMESTAMP WITH TIME ZONE
      );`;
      await this.query(playlistsTable);

      // Create Songs table
      const songsTable = `CREATE TABLE IF NOT EXISTS songs (
          song_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          artist VARCHAR(255),
          album VARCHAR(255),
          spotify_status VARCHAR(50) DEFAULT 'NOT_FOUND' CHECK (spotify_status IN ('HARD_MATCH', 'SOFT_MATCH', 'NOT_FOUND')),
          spotify_ref TEXT,
          youtube_status VARCHAR(50) DEFAULT 'NOT_FOUND' CHECK (youtube_status IN ('HARD_MATCH', 'SOFT_MATCH', 'NOT_FOUND')),
          youtube_ref TEXT,
          search_vector TSVECTOR
      );`;
      await this.query(songsTable);

      // Create trigger function for updating search vector
      const updateSearchVectorFunction = `
      CREATE OR REPLACE FUNCTION update_songs_search_vector() RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector :=
            to_tsvector('english', COALESCE(NEW.title, '') || ' ' ||
                                    COALESCE(NEW.artist, '') || ' ' ||
                                    COALESCE(NEW.album, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      `;
      await this.query(updateSearchVectorFunction);

      // Create trigger to update search vector on insert or update
      const updateSearchVectorTrigger = `
      DO $$
      BEGIN
          -- Check if the trigger already exists
          IF NOT EXISTS (
              SELECT 1
              FROM pg_trigger
              WHERE tgname = 'songs_search_vector_update'
          ) THEN
              -- Create the trigger if it does not exist
              EXECUTE 'CREATE TRIGGER songs_search_vector_update
                      BEFORE INSERT OR UPDATE OF title, artist, album ON songs
                      FOR EACH ROW EXECUTE FUNCTION update_songs_search_vector();';
          END IF;
      END;
      $$;
      `;
      await this.query(updateSearchVectorTrigger);

      // Create index on search vector column for full text search
      const createSearchVectorIndex = `CREATE INDEX IF NOT EXISTS idx_songs_search_vector ON songs USING GIN(search_vector);`;
      await this.query(createSearchVectorIndex);

      // Validate tables created
      const res = await this.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
      console.log('Tables available:', res.rows.map(row => row.table_name).join(', '));

      // Close connection
      client.release();

      console.log('Database initialization complete');
    } catch (err) {
      console.log(`Database initialization error: ${err}`);
    }
  }

}

module.exports = Database;
