import { describe, expect, it } from 'vitest';
import type { ErrorCode } from '../types.ts';
import { getStatus, HTTP_STATUS } from './httpStatus.ts';

const ALL_ERROR_CODES: ErrorCode[] = [
  'EMAIL_EXISTS',
  'USER_NOT_FOUND',
  'INVALID_CREDENTIALS',
  'SURVEY_NOT_FOUND',
  'FORBIDDEN',
  'DB_ERROR',
  'VALIDATION_ERROR',
  'INTERNAL_ERROR',
  'UNAUTHORIZED',
  'TOKEN_EXPIRED',
  'INVALID_TOKEN',
  'ALREADY_RESPONDED',
  'TOO_MANY_REQUESTS',
];

describe('getStatus', () => {
  it('returns 409 for EMAIL_EXISTS', () => {
    expect(getStatus('EMAIL_EXISTS')).toBe(409);
  });

  it('returns 404 for USER_NOT_FOUND and SURVEY_NOT_FOUND', () => {
    expect(getStatus('USER_NOT_FOUND')).toBe(404);
    expect(getStatus('SURVEY_NOT_FOUND')).toBe(404);
  });

  it('returns 401 for authentication errors', () => {
    expect(getStatus('INVALID_CREDENTIALS')).toBe(401);
    expect(getStatus('UNAUTHORIZED')).toBe(401);
    expect(getStatus('TOKEN_EXPIRED')).toBe(401);
  });

  it('returns 403 for FORBIDDEN and INVALID_TOKEN', () => {
    expect(getStatus('FORBIDDEN')).toBe(403);
    expect(getStatus('INVALID_TOKEN')).toBe(403);
  });

  it('returns 500 for DB_ERROR and INTERNAL_ERROR', () => {
    expect(getStatus('DB_ERROR')).toBe(500);
    expect(getStatus('INTERNAL_ERROR')).toBe(500);
  });

  it('returns 400 for VALIDATION_ERROR', () => {
    expect(getStatus('VALIDATION_ERROR')).toBe(400);
  });

  it('returns 429 for TOO_MANY_REQUESTS', () => {
    expect(getStatus('TOO_MANY_REQUESTS')).toBe(429);
  });

  it('returns 500 for an unknown code', () => {
    expect(getStatus('UNKNOWN_CODE' as ErrorCode)).toBe(500);
  });
});

describe('HTTP_STATUS', () => {
  it('has a numeric status for every ErrorCode', () => {
    for (const code of ALL_ERROR_CODES) {
      expect(HTTP_STATUS[code]).toBeTypeOf('number');
    }
  });

  it('covers exactly the same set of codes as ALL_ERROR_CODES', () => {
    const expected = Object.keys(HTTP_STATUS).sort();
    const actual = [...ALL_ERROR_CODES].sort();
    expect(actual).toEqual(expected);
  });
});