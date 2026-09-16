// Back/src/validators/authValidator.ts
import type { Request, Response, NextFunction } from "express";
import { errors, sendResponse } from "../utils/helpers.ts";

const MAX_EMAIL_LENGTH = 255;
const MAX_PASSWORD_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 6;

export function validateRegistration(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendResponse(res, errors.validation("Email and password are required"));
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
        return sendResponse(res, errors.validation("Email and password must be strings"));
    }

    const clearEmail = email.trim().toLowerCase();
    const clearPassword = password.trim();

    if (clearEmail.length === 0 || clearPassword.length === 0) {
        return sendResponse(res, errors.validation("Email and password cannot be empty"));
    }

    if (clearEmail.length > MAX_EMAIL_LENGTH) {
        return sendResponse(res, errors.validation(`Email must be up to ${MAX_EMAIL_LENGTH} chars`));
    }

    if (clearPassword.length < MIN_PASSWORD_LENGTH || clearPassword.length > MAX_PASSWORD_LENGTH) {
        return sendResponse(res, errors.validation(`Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} chars`));
    }

    if (!isValidEmail(clearEmail)) {
        return sendResponse(res, errors.validation("Invalid email format"));
    }

    req.body.email = clearEmail;
    req.body.password = clearPassword;

    next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendResponse(res, errors.validation("Email and password are required"));
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
        return sendResponse(res, errors.validation("Email and password must be strings"));
    }

    const clearEmail = email.trim().toLowerCase();
    const clearPassword = password.trim();

    if (clearEmail.length === 0 || clearPassword.length === 0) {
        return sendResponse(res, errors.validation("Email and password cannot be empty"));
    }

    req.body.email = clearEmail;
    req.body.password = clearPassword;

    next();
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}