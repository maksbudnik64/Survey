import type { NextFunction, Request, Response } from 'express';
import { errors, sendResponse } from '../utils/helpers.ts';
import {
  MAX_TITLE_LENGTH,
  MAX_QUESTION_TEXT_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_QUESTIONS,
  MAX_OPTIONS,
} from '../constants.ts';

export function validateSurvey(req: Request, res: Response, next: NextFunction): void {
  const { title, questions } = req.body;

  if (!title) {
    sendResponse(res, errors.validation('Survey title is required'));
    return;
  }

  if (typeof title !== 'string') {
    sendResponse(res, errors.validation('Title must be a string'));
    return;
  }

  const clearTitle = title.trim();

  if (clearTitle.length === 0) {
    sendResponse(res, errors.validation('Title cannot be empty'));
    return;
  }

  if (clearTitle.length > MAX_TITLE_LENGTH) {
    sendResponse(res, errors.validation(`Title must be up to ${MAX_TITLE_LENGTH} chars`));
    return;
  }

  if (questions === undefined) {
    sendResponse(res, errors.validation('Questions are required'));
    return;
  }

  if (!Array.isArray(questions)) {
    sendResponse(res, errors.validation('Questions must be an array'));
    return;
  }

  if (questions.length === 0) {
    sendResponse(res, errors.validation('At least one question is required'));
    return;
  }

  if (questions.length > MAX_QUESTIONS) {
    sendResponse(res, errors.validation(`Max ${MAX_QUESTIONS} questions allowed`));
    return;
  }

  for (const [index, q] of questions.entries()) {
    const error = validateQuestion(q, index);
    if (error) {
      sendResponse(res, errors.validation(error));
      return;
    }
  }

  req.body.title = clearTitle;
  next();
}

function validateQuestion(q: unknown, index: number): string | null {
  const prefix = `Question ${index + 1}`;

  if (!q || typeof q !== 'object') {
    return `${prefix}: must be an object`;
  }

  const question = q as Record<string, unknown>;

  if (typeof question.text !== 'string') {
    return `${prefix}: text must be a string`;
  }

  const clearText = question.text.trim();
  if (clearText.length === 0) {
    return `${prefix}: text cannot be empty`;
  }
  if (clearText.length > MAX_QUESTION_TEXT_LENGTH) {
    return `${prefix}: text must be up to ${MAX_QUESTION_TEXT_LENGTH} chars`;
  }

  if (question.type === 'text') {
    question.text = clearText;
    return null;
  }

  if (question.type === 'single_choice' || question.type === 'multiple_choice') {
    if (!Array.isArray(question.options)) {
      return `${prefix}: options must be an array`;
    }
    if (question.options.length === 0) {
      return `${prefix}: at least one option required`;
    }
    if (question.options.length > MAX_OPTIONS) {
      return `${prefix}: max ${MAX_OPTIONS} options allowed`;
    }

    const cleanedOptions: string[] = [];
    for (const [oi, opt] of question.options.entries()) {
      if (typeof opt !== 'string') {
        return `${prefix}: option ${oi + 1} must be a string`;
      }
      const clearOpt = opt.trim();
      if (clearOpt.length === 0) {
        return `${prefix}: option ${oi + 1} cannot be empty`;
      }
      if (clearOpt.length > MAX_OPTION_LENGTH) {
        return `${prefix}: option ${oi + 1} must be up to ${MAX_OPTION_LENGTH} chars`;
      }
      cleanedOptions.push(clearOpt);
    }

    question.text = clearText;
    question.options = cleanedOptions;
    return null;
  }

  return `${prefix}: invalid type "${String(question.type)}"`;
}