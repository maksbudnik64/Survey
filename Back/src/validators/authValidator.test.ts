import { describe, expect, it } from 'vitest';
import { runValidator, createMockRequest, createMockResponse } from '../test/mocks.ts';
import {
  isValidEmail,
  parseCredentials,
  validateLogin,
  validateRegistration,
} from './authValidator.ts';
import {
  MAX_EMAIL_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '../constants.ts';

describe('parseCredentials', () => {
  it('returns null and sends response when email is missing', () => {
    const req = createMockRequest({ password: 'password' });
    const res = createMockResponse();

    const result = parseCredentials(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email and password are required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns null and sends response when password is missing', () => {
    const req = createMockRequest({ email: 'test@example.com' });
    const res = createMockResponse();

    const result = parseCredentials(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email and password are required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns null and sends response when email is not a string', () => {
    const req = createMockRequest({ email: 123, password: 'password' });
    const res = createMockResponse();

    const result = parseCredentials(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email and password must be strings',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns null and sends response when password is not a string', () => {
    const req = createMockRequest({ email: 'test@example.com', password: 123 });
    const res = createMockResponse();

    const result = parseCredentials(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email and password must be strings',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns null and sends response when email becomes empty after trimming', () => {
    const req = createMockRequest({ email: '   ', password: 'password' });
    const res = createMockResponse();

    const result = parseCredentials(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email and password cannot be empty',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns null and sends response when password becomes empty after trimming', () => {
    const req = createMockRequest({ email: 'test@example.com', password: '   ' });
    const res = createMockResponse();

    const result = parseCredentials(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email and password cannot be empty',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns normalized email and password when input is valid', () => {
    const req = createMockRequest({
      email: '  TEST@EXAMPLE.COM  ',
      password: '  PASSWORD  ',
    });
    const res = createMockResponse();

    const result = parseCredentials(req, res);

    expect(result).toEqual({ email: 'test@example.com', password: 'PASSWORD' });
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('validateLogin', () => {
  it('calls next and normalizes req.body when credentials are valid', () => {
    const { req, res, next } = runValidator(validateLogin, {
      email: '  TEST@EXAMPLE.COM  ',
      password: '  PASSWORD  ',
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body.email).toBe('test@example.com');
    expect(req.body.password).toBe('PASSWORD');
  });

  it('does not call next when password is missing', () => {
    const { res, next } = runValidator(validateLogin, { email: 'test@example.com' });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('does not call next when email is not a string', () => {
    const { next } = runValidator(validateLogin, { email: 123, password: 'password' });

    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateRegistration', () => {
  it('calls next and normalizes req.body when credentials are valid', () => {
    const { req, res, next } = runValidator(validateRegistration, {
      email: '  TEST@EXAMPLE.COM  ',
      password: '  PASSWORD  ',
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body.email).toBe('test@example.com');
    expect(req.body.password).toBe('PASSWORD');
  });

  it('does not call next when credentials are missing', () => {
    const { res, next } = runValidator(validateRegistration, {});

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects an email longer than MAX_EMAIL_LENGTH', () => {
    const longEmail = 'a'.repeat(MAX_EMAIL_LENGTH) + '@example.com';

    const { res, next } = runValidator(validateRegistration, {
      email: longEmail,
      password: 'password',
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: `Email must be up to ${MAX_EMAIL_LENGTH} chars`,
      code: 'VALIDATION_ERROR',
    });
  });

  it('accepts an email of exactly MAX_EMAIL_LENGTH', () => {
    // local part padding so total length equals MAX_EMAIL_LENGTH
    const domain = '@b.co';
    const email = 'a'.repeat(MAX_EMAIL_LENGTH - domain.length) + domain;

    const { res, next } = runValidator(validateRegistration, {
      email,
      password: 'password',
    });

    expect(email).toHaveLength(MAX_EMAIL_LENGTH);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than MIN_PASSWORD_LENGTH', () => {
    const { res, next } = runValidator(validateRegistration, {
      email: 'test@example.com',
      password: 'a'.repeat(MIN_PASSWORD_LENGTH - 1),
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} chars`,
      code: 'VALIDATION_ERROR',
    });
  });

  it('accepts a password of exactly MIN_PASSWORD_LENGTH', () => {
    const { res, next } = runValidator(validateRegistration, {
      email: 'test@example.com',
      password: 'a'.repeat(MIN_PASSWORD_LENGTH),
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a password longer than MAX_PASSWORD_LENGTH', () => {
    const { res, next } = runValidator(validateRegistration, {
      email: 'test@example.com',
      password: 'a'.repeat(MAX_PASSWORD_LENGTH + 1),
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} chars`,
      code: 'VALIDATION_ERROR',
    });
  });

  it('accepts a password of exactly MAX_PASSWORD_LENGTH', () => {
    const { res, next } = runValidator(validateRegistration, {
      email: 'test@example.com',
      password: 'a'.repeat(MAX_PASSWORD_LENGTH),
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a malformed email address', () => {
    const { res, next } = runValidator(validateRegistration, {
      email: 'invalid-email',
      password: 'password',
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid email format',
      code: 'VALIDATION_ERROR',
    });
  });
});

describe('isValidEmail', () => {
  it.each([
    'test@example.com',
    'user.name@domain.co.uk',
    'another.email+tag@sub.domain.org',
  ])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    'invalid-email',
    'missing-at-sign.com',
    'no-domain@',
    '@no-local-part.com',
    'spaces in@email.com',
    'two@@at.com',
  ])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});