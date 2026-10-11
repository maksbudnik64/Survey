// ----- ПОЛЬЗОВАТЕЛЬ -----
export interface PublicUser {
    id: number;
    email: string;
}

// ----- ВОПРОСЫ (Discriminated Union) -----
export interface TextQuestion {
    id: number | undefined;
    type: 'text';
    text: string;
}

export interface ChoiceQuestion {
    id: number | undefined;
    type: 'single_choice' | 'multiple_choice';
    text: string;
    options: string[];
}

export type Question = TextQuestion | ChoiceQuestion;

// ----- ОПРОС -----
export interface Survey {
    id: number;
    title: string;
    author_id: number;         // 👈 ДОБАВЛЕНО
    answers_counter: number;   // 👈 было optional
    created_at: string;        // 👈 строка (JSON)
}

export interface SurveyWithQuestions extends Survey {
    questions: Question[];
}

// ----- ОТВЕТЫ -----
export interface Answer {
    id: number;
    answers: Record<string, string | string[]>;
}

// ----- КОДЫ ОШИБОК -----
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

// ----- API ОТВЕТЫ -----
export type ApiResponse<T> =
    | { success: true; data: T | null }
    | { success: false; error: string; code: ErrorCode };  // 👈 добавлен code