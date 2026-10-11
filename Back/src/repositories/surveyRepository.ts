import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/db.ts';
import type {
  Answer,
  ApiResponse,
  ChoiceQuestion,
  Question,
  Survey,
} from '../types.ts';
import { errors, ok } from '../utils/helpers.ts';

export async function selectMySurveys(userId: number): Promise<ApiResponse<Survey[]>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         surveys.id,
         surveys.title,
         surveys.author_id,
         surveys.created_at,
         COUNT(responses.id) AS answers_counter
       FROM surveys
       LEFT JOIN responses ON surveys.id = responses.survey_id
       WHERE surveys.author_id = ?
       GROUP BY surveys.id, surveys.title, surveys.created_at`,
      [userId]
    );
    return ok(rows.length > 0 ? (rows as Survey[]) : null);
  } catch {
    return errors.dbError('Failed to get surveys');
  }
}

export async function selectSurveys(): Promise<ApiResponse<Survey[]>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         surveys.id,
         surveys.title,
         surveys.author_id,
         surveys.created_at,
         COUNT(responses.id) AS answers_counter
       FROM surveys
       LEFT JOIN responses ON surveys.id = responses.survey_id
       GROUP BY surveys.id, surveys.title, surveys.created_at
       ORDER BY surveys.created_at DESC`
    );
    return ok(rows.length > 0 ? (rows as Survey[]) : null);
  } catch {
    return errors.dbError('Failed to get surveys');
  }
}

export async function selectSurveyById(surveyId: number): Promise<ApiResponse<Survey>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         surveys.id,
         surveys.title,
         surveys.author_id,
         surveys.created_at,
         COUNT(responses.id) AS answers_counter
       FROM surveys
       LEFT JOIN responses ON surveys.id = responses.survey_id
       WHERE surveys.id = ?
       GROUP BY surveys.id, surveys.title, surveys.created_at`,
      [surveyId]
    );
    return ok(rows.length > 0 ? (rows[0] as Survey) : null);
  } catch {
    return errors.dbError('Failed to get survey');
  }
}

export async function selectSurveyQuestions(surveyId: number): Promise<ApiResponse<Question[]>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, type, text, options
       FROM questions
       WHERE survey_id = ?
       ORDER BY id`,
      [surveyId]
    );

    if (rows.length === 0) {
      return errors.internal('Questions not found for survey');
    }

    return ok(rows.map(rowToQuestion));
  } catch {
    return errors.dbError('Failed to get questions');
  }
}

export async function selectSurveyAnswers(surveyId: number): Promise<ApiResponse<Answer[]>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, answers
       FROM responses
       WHERE survey_id = ?
       ORDER BY id`,
      [surveyId]
    );

    return ok(rows.map(rowToAnswer));
  } catch {
    return errors.dbError('Failed to get answers');
  }
}

export async function insertNewSurvey(
  authorId: number,
  title: string,
  questions: Question[]
): Promise<ApiResponse<number>> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [surveyResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO surveys (author_id, title) VALUES (?, ?)',
      [authorId, title]
    );
    const surveyId = surveyResult.insertId;

    await insertQuestions(connection, surveyId, questions);

    await connection.commit();
    return ok(surveyId);
  } catch {
    await connection.rollback();
    return errors.dbError('Failed to insert new survey');
  } finally {
    connection.release();
  }
}

export async function insertResponse(
  surveyId: number,
  userId: number,
  answers: Record<string, string | string[]>
): Promise<ApiResponse<number>> {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO responses (survey_id, user_id, answers) VALUES (?, ?, ?)',
      [surveyId, userId, JSON.stringify(answers)]
    );
    return ok(result.insertId);
  } catch (error: unknown) {
    if (isDuplicateEntryError(error)) {
      return errors.alreadyResponded();
    }
    console.error('Failed to insert response:', error);
    return errors.dbError('Failed to insert response');
  }
}

export async function hasUserResponded(
  surveyId: number,
  userId: number
): Promise<ApiResponse<boolean>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM responses WHERE survey_id = ? AND user_id = ? LIMIT 1',
      [surveyId, userId]
    );
    return ok(rows.length > 0);
  } catch {
    return errors.dbError('Failed to check response');
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

    await connection.query('UPDATE surveys SET title = ? WHERE id = ?', [title, surveyId]);
    await connection.query('DELETE FROM questions WHERE survey_id = ?', [surveyId]);
    await connection.query('DELETE FROM responses WHERE survey_id = ?', [surveyId]);

    await insertQuestions(connection, surveyId, questions);

    await connection.commit();
    return selectSurveyById(surveyId);
  } catch (error) {
    console.error('Failed to update survey:', error);
    await connection.rollback();
    return errors.dbError('Failed to update survey');
  } finally {
    connection.release();
  }
}

export async function deleteSurvey(surveyId: number): Promise<ApiResponse<null>> {
  try {
    await pool.query('DELETE FROM surveys WHERE id = ?', [surveyId]);
    return ok(null);
  } catch {
    return errors.dbError('Failed to delete survey');
  }
}

async function insertQuestions(
  connection: PoolConnection,
  surveyId: number,
  questions: Question[]
): Promise<void> {
  for (const q of questions) {
    const options = q.type === 'text' ? null : JSON.stringify(q.options);
    await connection.query(
      'INSERT INTO questions (survey_id, text, type, options) VALUES (?, ?, ?, ?)',
      [surveyId, q.text, q.type, options]
    );
  }
}

function rowToQuestion(row: RowDataPacket): Question {
  const id = Number(row.id);
  const text = String(row.text);

  if (row.type === 'text') {
    return { id, type: 'text', text };
  }

  const options =
    typeof row.options === 'string' ? (JSON.parse(row.options) as string[]) : (row.options ?? []);

  return {
    id,
    type: row.type as ChoiceQuestion['type'],
    text,
    options,
  };
}

function rowToAnswer(row: RowDataPacket): Answer {
  return {
    id: Number(row.id),
    answers:
      typeof row.answers === 'string'
        ? (JSON.parse(row.answers) as Record<string, string | string[]>)
        : (row.answers ?? {}),
  };
}

function isDuplicateEntryError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'ER_DUP_ENTRY'
  );
}