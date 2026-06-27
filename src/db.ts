import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Initialize the database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function for running queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

/* 👇 ADD THIS TEST BLOCK AT THE VERY BOTTOM 👇 */
pool.query('SELECT NOW()')
  .then((res) => {
    console.log('⚡ [database]: PostgreSQL connection established successfully at:', res.rows[0].now);
  })
  .catch((err) => {
    console.error('❌ [database]: PostgreSQL connection failed!');
    console.error(err.message);
  });