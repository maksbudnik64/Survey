import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db.ts";
import type { ApiResponse, Survey } from "../types.ts";

export async function selectMySurveys(id: number): Promise<ApiResponse<Survey[]>>{
    try{
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT * FROM surveys WHERE author_id = ?`,
    [id]);
if (rows.length > 0) {
            return {success: true, data: rows as Survey[]}
        }
    return {success: true, data: null}
    } catch {
return {success: false, error: "Failed to get surveys from DB"}
    }
}