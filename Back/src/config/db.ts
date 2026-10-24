import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

export const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'surveydb',
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
});

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('MySQL connected successfully');
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('MySQL connection error:', message);
    return false;
  }
}