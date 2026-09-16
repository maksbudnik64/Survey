// ----- ПОЛЬЗОВАТЕЛЬ -----
export interface PublicUser {
    id: number;
    email: string;
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

// ----- ОПРОС -----
export interface Survey {
    id: number;
    title: string;
    created_at: string;
    answers_counter?: number;
}

// ----- API ОТВЕТЫ -----
export type ApiResponse<T> =
    | { success: true; data: T | null }
    | { success: false; error: string };
 