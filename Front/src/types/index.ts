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
    created_at: string;
    answers_counter?: number;
}

export interface SurveyWithQuestions extends Survey {
    questions: Question[];
}

export interface Answer {
    id: number;
    answers: Record<string, string | string[]>;
}

// ----- API ОТВЕТЫ -----
export type ApiResponse<T> =
    | { success: true; data: T | null }
    | { success: false; error: string };
 