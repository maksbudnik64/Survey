import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthResponse, PublicUser } from '../types.ts';
import { insertNewUser, selectUserByEmail } from '../repositories/userRepository.ts';
import { errors, ok } from '../utils/helpers.ts';
import { requireEnv } from '../utils/env.ts';

const JWT_SECRET = requireEnv('JWT_SECRET');
const BCRYPT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

export async function createUser(email: string, password: string): Promise<AuthResponse> {
  const existing = await selectUserByEmail(email);
  if (!existing.success) return existing;
  if (existing.data) return errors.emailExists();

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await insertNewUser(email, password_hash);
  if (!result.success) return result;
  if (!result.data) return errors.internal('User creation failed');

  const user: PublicUser = { id: result.data.id, email };
  const token = generateJWT(user);

  return ok({ token, user });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const existing = await selectUserByEmail(email);
  if (!existing.success) return existing;
  if (!existing.data) return errors.invalidCredentials();

  const match = await bcrypt.compare(password, existing.data.password_hash);
  if (!match) return errors.invalidCredentials();

  const user: PublicUser = { id: existing.data.id, email: existing.data.email };
  const token = generateJWT(user);

  return ok({ token, user });
}

function generateJWT(user: PublicUser): string {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}