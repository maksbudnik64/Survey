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
    type: 'text';
    text: string;
}

export interface ChoiceQuestion {
    type: 'single_choice' | 'multiple_choice';
    text: string;
    options: string[];
}

export type Question = TextQuestion | ChoiceQuestion;

export interface Survey {
    id: number;
    title: string;
    answers_counter: number;
    created_at: Date;
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
    | 'INTERNAL_ERROR';

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