// Back/src/utils/apiResponse.ts
import type { ApiResponse, ErrorCode } from "../types.ts";
import type { Response } from "express";
import { getStatus } from "./httpStatus.ts";

export function ok<T>(data: T | null = null): ApiResponse<T> {
    return { success: true, data };
}

export function fail<T = never>(error: string, code: ErrorCode): ApiResponse<T> {
    return { success: false, error, code };
}

export const errors = {
    emailExists: () => fail("Email already exists", "EMAIL_EXISTS"),
    userNotFound: () => fail("User not found", "USER_NOT_FOUND"),
    invalidCredentials: () => fail("Invalid email or password", "INVALID_CREDENTIALS"),
    surveyNotFound: () => fail("Survey not found", "SURVEY_NOT_FOUND"),
    forbidden: () => fail("Forbidden", "FORBIDDEN"),
    dbError: (msg = "Database error") => fail(msg, "DB_ERROR"),
    validation: (msg: string) => fail(msg, "VALIDATION_ERROR"),
    internal: (msg = "Internal error") => fail(msg, "INTERNAL_ERROR"),
};

export function sendResponse<T>(res: Response, result: ApiResponse<T>): void {
    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(getStatus(result.code)).json(result);
    }
}