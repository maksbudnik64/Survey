export interface User {
    id: number,
    email: string,
    password_hash: string
}

export interface PublicUser {
    id: number,
    email: string
}

export interface Survey {
    id: number;
    title: string;
    author_id: number;
    created_at: Date;
}

// ----- ОТВЕТЫ API -----
export type ApiResponse<T> =
    | { success: true; data: T | null}
    | { success: false; error: string };

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