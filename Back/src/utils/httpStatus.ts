import type { ErrorCode } from '../types.ts';

export const HTTP_STATUS: Record<ErrorCode, number> = {
  EMAIL_EXISTS: 409,
  USER_NOT_FOUND: 404,
  INVALID_CREDENTIALS: 401,
  SURVEY_NOT_FOUND: 404,
  FORBIDDEN: 403,
  DB_ERROR: 500,
  VALIDATION_ERROR: 400,
  INTERNAL_ERROR: 500,
  UNAUTHORIZED: 401,
  TOKEN_EXPIRED: 401,
  INVALID_TOKEN: 403,
  ALREADY_RESPONDED: 409,
  TOO_MANY_REQUESTS: 429,
};

export function getStatus(code: ErrorCode): number {
  return HTTP_STATUS[code] ?? 500;
}