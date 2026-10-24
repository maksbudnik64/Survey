import { vi } from 'vitest';
import type { Mock } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

export type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export function createMockRequest(body: Record<string, unknown> = {}): Request {
  return { body } as unknown as Request;
}

export function createMockResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

export function runValidator(
  validator: Middleware,
  body: Record<string, unknown>
): { req: Request; res: Response; next: Mock } {
  const req = createMockRequest(body);
  const res = createMockResponse();
  const next = vi.fn();

  validator(req, res, next);

  return { req, res, next };
}