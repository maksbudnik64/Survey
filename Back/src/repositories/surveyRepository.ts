import type { ResultSetHeader,  RowDataPacket } from "mysql2";
import { pool } from "../config/db.ts";
import type { Answer, ApiResponse, ChoiceQuestion, Question, Survey, TextQuestion } from "../types.ts";
import { errors, ok } from "../utils/helpers.ts";

export async function selectMySurveys(userId: number): Promise<ApiResponse<Survey[]>>{
    try{
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
                surveys.id,
                surveys.title,
                surveys.author_id,
                surveys.created_at,
                COUNT(responses.id) AS answers_counter
            FROM surveys
            LEFT JOIN responses ON surveys.id = responses.survey_id
            WHERE surveys.author_id = ?
            GROUP BY surveys.id, surveys.title, surveys.created_at`,
    [userId]);
if (rows.length > 0) {
            return ok(rows as Survey[]);
        }
    return ok(null);
    } catch {
    return errors.dbError("Failed to get surveys");
    }
}

export async function selectSurveys(): Promise<ApiResponse<Survey[]>>{
    try{
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
                surveys.id,
                surveys.title,
                surveys.author_id,
                surveys.created_at,
                COUNT(responses.id) AS answers_counter
            FROM surveys
            LEFT JOIN responses ON surveys.id = responses.survey_id
            GROUP BY surveys.id, surveys.title, surveys.created_at
            ORDER BY surveys.created_at DESC`);
if (rows.length > 0) {
            return ok(rows as Survey[]);
        }
    return ok(null)
    } catch {
    return errors.dbError("Failed to get surveys");
    }
}

export async function selectSurveyById (surveyId: number): Promise<ApiResponse<Survey>>{
    try{
        const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
                surveys.id,
                surveys.title,
                surveys.author_id,
                surveys.created_at,
                COUNT(responses.id) AS answers_counter
            FROM surveys
            LEFT JOIN responses ON surveys.id = responses.survey_id
            WHERE surveys.id = ?
            GROUP BY surveys.id, surveys.title, surveys.created_at`, [surveyId]);
        if (rows.length > 0) {
            return ok(rows[0] as Survey);
        }
        return ok(null);
    } catch {
        return errors.dbError("Failed to get survey");
    }
}

export async function selectSurveyQuestions(surveyId: number): Promise<ApiResponse<Question[]>>{
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT id, type, text, options
            FROM questions
            WHERE survey_id = ?
            ORDER BY id`, [surveyId]); 

        if (rows.length === 0) {
            return errors.internal('Questions not found for survey');
        }

        const questions: Question[] = rows.map((row: any) => {
            if (row.type === 'text') {
                return {
                    id: Number(row.id),
                    type: 'text',
                    text: row.text,
                } as TextQuestion;
            }
            return {
                id: Number(row.id),
                type: row.type,
                text: row.text,
                options: row.options ? JSON.parse(row.options) : [],
            } as ChoiceQuestion;
        });

        return ok(questions);
    } catch {
        return errors.dbError('Failed to get questions');
    }
}

export async function selectSurveyAnswers(surveyId: number): Promise<ApiResponse<Answer[]>>{
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT id, answers
            FROM responses
            WHERE survey_id = ?
            ORDER BY id`, [surveyId]);
        
                const answers: Answer[] = rows.map((row: any) => {
                    return {
                        id: Number(row.id),
                        answers:  row.answers ? JSON.parse(row.answers) : {},
                    }
                });

                return ok(answers);
            } catch {
        return errors.dbError('Failed to get answers')
    }
}

export async function insertNewSurvey(authorId: number, title: string, questions: Question[]): Promise<ApiResponse<number>>{
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [surveyResult] = await connection.query<ResultSetHeader>(`
            INSERT INTO surveys (author_id, title) VALUES (?, ?)`, [authorId, title]);
            const surveyId = surveyResult.insertId;

        for (const q of questions){
            if (q.type === 'text') {
                await connection.query(`
                    INSERT INTO questions (survey_id, text, type, options) VALUES (?, ?, ?, ?)`, [surveyId, q.text, q.type, null]);
            } else {
                await connection.query(`
                    INSERT INTO questions (survey_id, text, type, options) VALUES (?, ?, ?, ?)`, [surveyId, q.text, q.type, JSON.stringify(q.options)]);
            }
        }
        await connection.commit();
        return ok(surveyId);
    } catch {
        await connection.rollback();
        return errors.dbError('Failed to insert new survey')
    } finally {
        connection.release();
    }
}

export async function insertResponse(userId: number, surveyId: number, answers: Record<string, string | string[]>): Promise<ApiResponse<number>>{
    try{
        const [result] = await pool.query<ResultSetHeader>(`
            INSERT INTO responses (survey_id, user_id, answers) VALUES (?, ?, ?)`, [surveyId, userId, JSON.stringify(answers)]);
            return ok(result.insertId)
    } catch(error: any) {
        if (error.code === 'ER_DUP_ENTRY'){
           return errors.alreadyResponded();
        }
        return errors.dbError('Failed to insert response')
    }
}

export async function hasUserResponded(userId: number, surveyId: number): Promise<ApiResponse<boolean>>{
    try{
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT id FROM responses WHERE survey_id = ? AND user_id = ?`, [surveyId, userId]);
            if(rows.length > 0){
                return ok(true);
            }
            return ok(false);
    } catch {
        return errors.dbError('Failed to check response')
    }
}

export async function updateSurvey(
    surveyId: number,
    title: string,
    questions: Question[]
): Promise<ApiResponse<Survey>> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `UPDATE surveys SET title = ? WHERE id = ?`,
            [title, surveyId]
        );

        await connection.query(
            `DELETE FROM questions WHERE survey_id = ?`,
            [surveyId]
        );

        await connection.query(
            `DELETE FROM responses WHERE survey_id = ?`,
            [surveyId]
        );

        for (const q of questions) {
            if (q.type === 'text') {
                await connection.query(
                    `INSERT INTO questions (survey_id, text, type, options) VALUES (?, ?, ?, ?)`,
                    [surveyId, q.text, q.type, null]
                );
            } else {
                await connection.query(
                    `INSERT INTO questions (survey_id, text, type, options) VALUES (?, ?, ?, ?)`,
                    [surveyId, q.text, q.type, JSON.stringify(q.options)]
                );
            }
        }

        await connection.commit();
        return await selectSurveyById(surveyId);
    } catch (error) {
        console.error('Failed to update survey:', error);
        await connection.rollback();
        return errors.dbError('Failed to update survey');
    } finally {
        connection.release();
    }
}

export async function deleteSurvey(surveyId: number): Promise<ApiResponse<null>>{
    try{
        const [rows] = await pool.query<ResultSetHeader>(`
            DELETE FROM surveys
            WHERE id = ?`, [surveyId]);
            return ok(null);
    } catch {
        return errors.dbError('Failed to delete survey')
    }
}