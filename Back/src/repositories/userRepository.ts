import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.ts';
import type { ApiResponse, User } from '../types.ts';
import { errors, ok } from '../utils/helpers.ts';

export async function insertNewUser(
  email: string,
  password_hash: string
): Promise<ApiResponse<User>> {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, password_hash]
    );

    return ok({
      id: result.insertId,
      email,
      password_hash,
    });
  } catch (error: unknown) {
    if (isDuplicateEntryError(error)) {
      return errors.emailExists();
    }
    return errors.dbError('Failed to insert new user');
  }
}

export async function selectUserByEmail(email: string): Promise<ApiResponse<User>> {
  return selectUserWhere('email', email);
}

export async function selectUserById(id: number): Promise<ApiResponse<User>> {
  return selectUserWhere('id', id);
}

async function selectUserWhere(
  column: 'id' | 'email',
  value: string | number
): Promise<ApiResponse<User>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, password_hash FROM users WHERE ${column} = ?`,
      [value]
    );

    const row = rows[0];
    return ok(row ? (row as User) : null);
  } catch {
    return errors.dbError('Failed to find user');
  }
}

function isDuplicateEntryError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'ER_DUP_ENTRY'
  );
}