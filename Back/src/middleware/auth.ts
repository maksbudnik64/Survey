import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { errors, sendResponse } from '../utils/helpers.ts';
import { selectUserById } from '../repositories/userRepository.ts';
import { requireEnv } from '../utils/env.ts';

const JWT_SECRET = requireEnv('JWT_SECRET');

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendResponse(res, errors.unauthorized('Access token required'));
    return;
  }
  const token = authHeader.slice('Bearer '.length);

  let decoded: { id: number };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as { id: number };
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      sendResponse(res, errors.tokenExpired());
    } else {
      sendResponse(res, errors.invalidToken());
    }
    return;
  }

  const result = await selectUserById(decoded.id);
  if (!result.success) {
    sendResponse(res, errors.dbError('Failed to verify user'));
    return;
  }
  if (!result.data) {
    sendResponse(res, errors.userNotFound());
    return;
  }

  req.user = { id: result.data.id, email: result.data.email };
  next();
}