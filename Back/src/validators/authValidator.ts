import type { Request, Response, NextFunction } from 'express';
import { errors, sendResponse } from '../utils/helpers.ts';
import { MAX_EMAIL_LENGTH, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '../constants.ts';

type Credentials = { email: string; password: string };

export function parseCredentials(req: Request, res: Response): Credentials | null {
  const { email, password } = req.body;

  if (!email || !password) {
    sendResponse(res, errors.validation('Email and password are required'));
    return null;
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    sendResponse(res, errors.validation('Email and password must be strings'));
    return null;
  }

  const clearEmail = email.trim().toLowerCase();
  const clearPassword = password.trim();

  if (clearEmail.length === 0 || clearPassword.length === 0) {
    sendResponse(res, errors.validation('Email and password cannot be empty'));
    return null;
  }

  return { email: clearEmail, password: clearPassword };
}

export function validateRegistration(req: Request, res: Response, next: NextFunction): void {
  const credentials = parseCredentials(req, res);
  if (!credentials) return;

  const { email, password } = credentials;

  if (email.length > MAX_EMAIL_LENGTH) {
    sendResponse(res, errors.validation(`Email must be up to ${MAX_EMAIL_LENGTH} chars`));
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    sendResponse(
      res,
      errors.validation(`Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} chars`)
    );
    return;
  }

  if (!isValidEmail(email)) {
    sendResponse(res, errors.validation('Invalid email format'));
    return;
  }

  req.body.email = email;
  req.body.password = password;
  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const credentials = parseCredentials(req, res);
  if (!credentials) return;

  req.body.email = credentials.email;
  req.body.password = credentials.password;
  next();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}