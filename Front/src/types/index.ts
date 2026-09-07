export interface PublicUser {
    id: number,
    email: string
}

export type ApiResponse<T> =
    | { success: true; data: T | null}
    | { success: false; error: string };