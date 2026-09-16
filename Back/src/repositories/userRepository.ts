import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.ts";
import type { ApiResponse, User } from "../types.ts";
import { errors, ok } from "../utils/helpers.ts";

export async function insertNewUser(email: string, password_hash: string): Promise<ApiResponse<User>> {
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO users (email, password_hash) VALUES (?, ?)`,
            [email, password_hash]
        );
       const userResult = await selectUserById(result.insertId)
         if (!userResult.success) {
            return userResult;
        }

        if (!userResult.data) {
            return errors.internal("User created but not found");
        }

        return userResult;
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return errors.emailExists();
        }
        return errors.dbError('Failed to insert new user');
    }
}

export async function selectUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, email, password_hash FROM users WHERE email = ?`,
            [email]
        );

        if (rows.length > 0) {
            return ok(rows[0] as User);
        }
        return ok(null);
    } catch {
        return errors.dbError("Failed to find user");
    }
}

export async function selectUserById(id: number): Promise<ApiResponse<User>> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, email, password_hash FROM users WHERE id = ?`,
            [id]
        );

        if (rows.length > 0) {
            return ok(rows[0] as User);
        }
        return ok(null);
    } catch {
        return errors.dbError("Failed to find user");
    }
}