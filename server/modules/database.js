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

  static async connect() {
    try {
      console.log('Connecting to database...');
      const client = await this.pool.connect();
      this.status = true;
      console.log('Database connection successful');
      client.release(); // Release the client back to the pool
    } catch (err) {
      this.status = false;
      console.log(`Database connection error: ${err}`);
      console.log("Database connection url: ", process.env.DATABASE_URL)
    }
  }
}

module.exports = Database;
