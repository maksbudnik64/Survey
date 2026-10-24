import type { Response } from 'express';
import type { ApiResponse, ErrorCode } from '../types.ts';
import { getStatus } from './httpStatus.ts';

export function ok<T>(data: T | null = null): ApiResponse<T> {
  return { success: true, data };
}

export function fail<T = never>(error: string, code: ErrorCode): ApiResponse<T> {
  return { success: false, error, code };
}

export const errors = {
  emailExists: () => fail('Email already exists', 'EMAIL_EXISTS'),
  userNotFound: () => fail('User not found', 'USER_NOT_FOUND'),
  invalidCredentials: () => fail('Invalid email or password', 'INVALID_CREDENTIALS'),
  surveyNotFound: () => fail('Survey not found', 'SURVEY_NOT_FOUND'),
  forbidden: (msg = 'Forbidden') => fail(msg, 'FORBIDDEN'),
  unauthorized: (msg = 'Unauthorized') => fail(msg, 'UNAUTHORIZED'),
  tokenExpired: () => fail('Token expired', 'TOKEN_EXPIRED'),
  invalidToken: () => fail('Invalid token', 'INVALID_TOKEN'),
  dbError: (msg = 'Database error') => fail(msg, 'DB_ERROR'),
  validation: (msg = 'Validation error') => fail(msg, 'VALIDATION_ERROR'),
  internal: (msg = 'Internal error') => fail(msg, 'INTERNAL_ERROR'),
  alreadyResponded: () => fail('You have already responded', 'ALREADY_RESPONDED'),
  tooManyRequests: (msg = 'Too many requests') => fail(msg, 'TOO_MANY_REQUESTS'),
};

export function sendResponse<T>(res: Response, result: ApiResponse<T>): void {
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(getStatus(result.code)).json(result);
  }
}