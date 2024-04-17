import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

class Database {
  static pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
       rejectUnauthorized: false
   }
  });

  static async connect() {
    try {
      await this.pool.connect();
      this.status = true;
      console.log('Database connection successful');
    } catch (err) {
      this.status = false;
      console.log(`Database connection error: ${err}`);
    }
  }
}

export default Database;
