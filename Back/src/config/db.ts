import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

dotenv.config();

export const pool: Pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'surveydb',
    port: Number(process.env.DB_PORT) || 3306,
    connectionLimit: 10,
});

export async function testConnection(){
    try{
        const connection = await pool.getConnection()
        console.log('Mysql успешно подключена!')
        connection.release()
        return true
    } catch (error: any) {
        console.error('Ошибка подключения к MySQL:', error.message || error);
        return false
    }
}