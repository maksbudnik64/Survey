import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.ts";
import type { ApiResponse, User } from "../types.ts";

export async function insertNewUser(email: string, password_hash: string): Promise<ApiResponse<User>> {
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO users (email, password_hash) VALUES (?, ?)`,
            [email, password_hash]
        );
       const userResult = await selectUserById(result.insertId)
        return userResult;
    } catch {
        return { success: false, error: "Failed to insert new user to database" };
    }
}

export async function selectUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, email, password_hash FROM users WHERE email = ?`,
            [email]
        );

        if (rows.length > 0) {
            return { success: true, data: rows[0] as User};
        }
        return { success: true, data: null };
    } catch {
        return { success: false, error: "Failed to find user" };
    }
}

export async function selectUserById(id: number): Promise<ApiResponse<User>> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, email, password_hash FROM users WHERE id = ?`,
            [id]
        );

        if (rows.length > 0) {
            return { success: true, data: rows[0] as User};
        }
        return { success: true, data: null };
    } catch {
        return { success: false, error: "Failed to find user" };
    }
}