import type { Request, Response, NextFunction } from 'express';
import { errors, sendResponse } from '../utils/helpers.ts';
import {
  MAX_ANSWERS_JSON_SIZE,
  MAX_TEXT_ANSWER_LENGTH,
  MAX_ANSWERS_COUNT,
  MAX_OPTIONS,
  MAX_OPTION_LENGTH,
} from '../constants.ts';

export function validateAnswers(req: Request, res: Response, next: NextFunction): void {
  const jsonString = JSON.stringify(req.body);
  if (Buffer.byteLength(jsonString, 'utf8') > MAX_ANSWERS_JSON_SIZE) {
    sendResponse(
      res,
      errors.validation(`Answers payload too large (max ${MAX_ANSWERS_JSON_SIZE} bytes)`)
    );
    return;
  }

  const { answers } = req.body;

  if (answers === undefined || answers === null) {
    sendResponse(res, errors.validation('Answers are required'));
    return;
  }

  if (typeof answers !== 'object' || Array.isArray(answers)) {
    sendResponse(res, errors.validation('Answers must be an object'));
    return;
  }

  const keys = Object.keys(answers);

  if (keys.length === 0) {
    sendResponse(res, errors.validation('Answers cannot be empty'));
    return;
  }

  if (keys.length > MAX_ANSWERS_COUNT) {
    sendResponse(res, errors.validation(`Too many answers (max ${MAX_ANSWERS_COUNT})`));
    return;
  }

  for (const key of keys) {
    if (!/^\d+$/.test(key)) {
      sendResponse(res, errors.validation(`Invalid question ID: ${key}`));
      return;
    }

    const value = answers[key];

    if (value === null || value === undefined) {
      sendResponse(res, errors.validation(`Answer for question ${key} is empty`));
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed.length === 0) {
        sendResponse(res, errors.validation(`Answer for question ${key} cannot be empty`));
        return;
      }
      if (trimmed.length > MAX_TEXT_ANSWER_LENGTH) {
        sendResponse(
          res,
          errors.validation(
            `Answer for question ${key} is too long (max ${MAX_TEXT_ANSWER_LENGTH})`
          )
        );
        return;
      }

      answers[key] = trimmed;
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        sendResponse(res, errors.validation(`Answer for question ${key} cannot be empty array`));
        return;
      }
      if (value.length > MAX_OPTIONS) {
        sendResponse(res, errors.validation(`Too many options selected for question ${key}`));
        return;
      }

      const trimmed: string[] = [];
      for (const item of value) {
        if (typeof item !== 'string') {
          sendResponse(
            res,
            errors.validation(`Answer items for question ${key} must be strings`)
          );
          return;
        }
        const t = item.trim();
        if (t.length === 0) {
          sendResponse(
            res,
            errors.validation(`Answer items for question ${key} cannot be empty`)
          );
          return;
        }
        if (t.length > MAX_OPTION_LENGTH) {
          sendResponse(res, errors.validation(`Answer item for question ${key} is too long`));
          return;
        }
        trimmed.push(t);
      }

      answers[key] = trimmed;
      continue;
    }

    sendResponse(res, errors.validation(`Answer for question ${key} has invalid type`));
    return;
  }

  next();
}