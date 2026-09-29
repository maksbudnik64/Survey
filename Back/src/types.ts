export interface User {
    id: number,
    email: string,
    password_hash: string
}

export interface PublicUser {
    id: number,
    email: string
}

// ----- ВОПРОСЫ (Discriminated Union) -----
export interface TextQuestion {
    id: number;
    type: 'text';
    text: string;
}

export interface ChoiceQuestion {
    id: number;
    type: 'single_choice' | 'multiple_choice';
    text: string;
    options: string[];
}

export type Question = TextQuestion | ChoiceQuestion;

export interface Survey {
    id: number;
    title: string;
    author_id: number;
    answers_counter: number;
    created_at: Date;
}

export interface SurveyWithQuestions extends Survey {
    questions: Question[];
}

export interface Answer {
    id: number;
    answers: Record<string, string | string[]>;
}

// ----- ОТВЕТЫ API -----

export type ErrorCode =
    | 'EMAIL_EXISTS'
    | 'USER_NOT_FOUND'
    | 'INVALID_CREDENTIALS'
    | 'SURVEY_NOT_FOUND'
    | 'FORBIDDEN'
    | 'DB_ERROR'
    | 'VALIDATION_ERROR'
    | 'INTERNAL_ERROR'
    | 'UNAUTHORIZED'
    | 'TOKEN_EXPIRED'
    | 'INVALID_TOKEN'
    | 'ALREADY_RESPONDED';

export type ApiResponse<T> =
    | { success: true; data: T | null}
    | { success: false; error: string; code: ErrorCode };

export type AuthResponse = ApiResponse<{
    token: string;
    user: PublicUser;
}>;

export type SurveysResponse = ApiResponse<{
    surveys: Survey[];
}>;

declare global {
    namespace Express {
        interface Request {
            user?: PublicUser
        }
    }
}