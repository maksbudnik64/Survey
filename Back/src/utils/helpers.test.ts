import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import type { ErrorCode } from '../types.ts';
import { errors, fail, ok, sendResponse } from './helpers.ts';

function createMockResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

describe('ok', () => {
  it('wraps data in a success response', () => {
    const data = { message: 'Success' };
    expect(ok(data)).toEqual({ success: true, data });
  });

  it('defaults data to null when called without arguments', () => {
    expect(ok()).toEqual({ success: true, data: null });
  });
});

describe('fail', () => {
  it('wraps error and code in a failure response', () => {
    const code: ErrorCode = 'DB_ERROR';
    expect(fail('An error occurred', code)).toEqual({
      success: false,
      error: 'An error occurred',
      code,
    });
  });
});

describe('sendResponse', () => {
  it('sends 200 for a successful response', () => {
    const res = createMockResponse();
    const result = ok({ message: 'Success' });

    sendResponse(res, result);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it('sends 500 for DB_ERROR', () => {
    const res = createMockResponse();
    const result = fail('Database down', 'DB_ERROR');

    sendResponse(res, result);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it('sends 404 for USER_NOT_FOUND', () => {
    const res = createMockResponse();
    const result = fail('User not found', 'USER_NOT_FOUND');

    sendResponse(res, result);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it('sends 400 for VALIDATION_ERROR', () => {
    const res = createMockResponse();
    const result = fail('Invalid input', 'VALIDATION_ERROR');

    sendResponse(res, result);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(result);
  });
});

describe('errors factories without arguments', () => {
  it.each([
    ['emailExists', 'EMAIL_EXISTS', 'Email already exists'],
    ['userNotFound', 'USER_NOT_FOUND', 'User not found'],
    ['invalidCredentials', 'INVALID_CREDENTIALS', 'Invalid email or password'],
    ['surveyNotFound', 'SURVEY_NOT_FOUND', 'Survey not found'],
    ['tokenExpired', 'TOKEN_EXPIRED', 'Token expired'],
    ['invalidToken', 'INVALID_TOKEN', 'Invalid token'],
    ['alreadyResponded', 'ALREADY_RESPONDED', 'You have already responded'],
  ] as const)('%s returns %s', (errorFn, code, message) => {
    expect(errors[errorFn]()).toEqual({ success: false, error: message, code });
  });
});

describe('errors factories with default messages', () => {
  it.each([
    ['forbidden', 'FORBIDDEN', 'Forbidden'],
    ['unauthorized', 'UNAUTHORIZED', 'Unauthorized'],
    ['dbError', 'DB_ERROR', 'Database error'],
    ['validation', 'VALIDATION_ERROR', 'Validation error'],
    ['internal', 'INTERNAL_ERROR', 'Internal error'],
    ['tooManyRequests', 'TOO_MANY_REQUESTS', 'Too many requests'],
  ] as const)('%s returns %s with the default message', (errorFn, code, message) => {
    expect(errors[errorFn]()).toEqual({ success: false, error: message, code });
  });
});

describe('errors factories with custom messages', () => {
  it.each([
    ['forbidden', 'FORBIDDEN'],
    ['unauthorized', 'UNAUTHORIZED'],
    ['dbError', 'DB_ERROR'],
    ['validation', 'VALIDATION_ERROR'],
    ['internal', 'INTERNAL_ERROR'],
    ['tooManyRequests', 'TOO_MANY_REQUESTS'],
  ] as const)('%s overrides the default message', (errorFn, code) => {
    const custom = 'Custom message';
    expect(errors[errorFn](custom)).toEqual({
      success: false,
      error: custom,
      code,
    });
  });
});