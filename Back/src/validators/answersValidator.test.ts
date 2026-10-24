import { describe, expect, it } from 'vitest';
import { runValidator } from '../test/mocks.ts';
import { errors } from '../utils/helpers.ts';
import {
  MAX_ANSWERS_JSON_SIZE,
  MAX_TEXT_ANSWER_LENGTH,
  MAX_ANSWERS_COUNT,
  MAX_OPTIONS,
  MAX_OPTION_LENGTH,
} from '../constants.ts';
import { validateAnswers } from './answersValidator.ts';

function makeAnswers(count: number, value: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    result[String(i + 1)] = value;
  }
  return result;
}

describe('validateAnswers', () => {
  it('rejects when answers is too large', () => {
    const largeAnswers = { answers: 'a'.repeat(MAX_ANSWERS_JSON_SIZE + 1) };

    const { res, next } = runValidator(validateAnswers, largeAnswers);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation(`Answers payload too large (max ${MAX_ANSWERS_JSON_SIZE} bytes)`)
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when answers is null', () => {
    const { res, next } = runValidator(validateAnswers, { answers: null });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errors.validation('Answers are required'));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when answers is undefined', () => {
    const { res, next } = runValidator(validateAnswers, {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errors.validation('Answers are required'));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when answers is not an object', () => {
    const { res, next } = runValidator(validateAnswers, { answers: 'not-an-object' });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errors.validation('Answers must be an object'));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when answers is an array', () => {
    const { res, next } = runValidator(validateAnswers, { answers: ['a', 'b'] });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errors.validation('Answers must be an object'));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when answers is an empty object', () => {
    const { res, next } = runValidator(validateAnswers, { answers: {} });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errors.validation('Answers cannot be empty'));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when answers has too many keys', () => {
    const answers = makeAnswers(MAX_ANSWERS_COUNT + 1, 'Answer');

    const { res, next } = runValidator(validateAnswers, { answers });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation(`Too many answers (max ${MAX_ANSWERS_COUNT})`)
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts exactly MAX_ANSWERS_COUNT keys', () => {
    const answers = makeAnswers(MAX_ANSWERS_COUNT, 'Answer');

    const { res, next } = runValidator(validateAnswers, { answers });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects when a key is not a valid question ID', () => {
    const { res, next } = runValidator(validateAnswers, {
      answers: { 'invalid-id': 'Answer' },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errors.validation('Invalid question ID: invalid-id'));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when a key contains whitespace', () => {
    const { res, next } = runValidator(validateAnswers, { answers: { ' 1 ': 'Answer' } });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errors.validation('Invalid question ID:  1 '));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when an answer is null', () => {
    const { res, next } = runValidator(validateAnswers, { answers: { '1': null } });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation('Answer for question 1 is empty')
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when a text answer is empty after trim', () => {
    const { res, next } = runValidator(validateAnswers, { answers: { '1': '   ' } });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation('Answer for question 1 cannot be empty')
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when a text answer is too long', () => {
    const longAnswer = 'a'.repeat(MAX_TEXT_ANSWER_LENGTH + 1);

    const { res, next } = runValidator(validateAnswers, { answers: { '1': longAnswer } });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation(
        `Answer for question 1 is too long (max ${MAX_TEXT_ANSWER_LENGTH})`
      )
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a text answer of exactly MAX_TEXT_ANSWER_LENGTH', () => {
    const answer = 'a'.repeat(MAX_TEXT_ANSWER_LENGTH);

    const { res, next } = runValidator(validateAnswers, { answers: { '1': answer } });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('trims text answers in req.body', () => {
    const { req, res, next } = runValidator(validateAnswers, {
      answers: { '1': '  Valid answer  ' },
    });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(req.body.answers['1']).toBe('Valid answer');
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects when value is an empty array', () => {
    const { res, next } = runValidator(validateAnswers, { answers: { '1': [] } });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation('Answer for question 1 cannot be empty array')
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when too many options are selected', () => {
    const tooManyOptions = Array.from({ length: MAX_OPTIONS + 1 }, (_, i) => `Option ${i}`);

    const { res, next } = runValidator(validateAnswers, {
      answers: { '1': tooManyOptions },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation('Too many options selected for question 1')
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts exactly MAX_OPTIONS selected', () => {
    const options = Array.from({ length: MAX_OPTIONS }, (_, i) => `Option ${i}`);

    const { res, next } = runValidator(validateAnswers, { answers: { '1': options } });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects when an option is not a string', () => {
    const { res, next } = runValidator(validateAnswers, {
      answers: { '1': ['Option 1', 123] },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation('Answer items for question 1 must be strings')
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when an option is empty after trim', () => {
    const { res, next } = runValidator(validateAnswers, {
      answers: { '1': ['Option 1', '   '] },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation('Answer items for question 1 cannot be empty')
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when an option is too long', () => {
    const longOption = 'a'.repeat(MAX_OPTION_LENGTH + 1);

    const { res, next } = runValidator(validateAnswers, {
      answers: { '1': ['Option 1', longOption] },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation('Answer item for question 1 is too long')
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts an option of exactly MAX_OPTION_LENGTH', () => {
    const option = 'a'.repeat(MAX_OPTION_LENGTH);

    const { res, next } = runValidator(validateAnswers, { answers: { '1': [option] } });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('trims array answers in req.body', () => {
    const { req, res, next } = runValidator(validateAnswers, {
      answers: { '1': ['  Option 1  ', 'Option 2'] },
    });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(req.body.answers['1']).toEqual(['Option 1', 'Option 2']);
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects when an answer has an invalid type', () => {
    const { res, next } = runValidator(validateAnswers, { answers: { '1': 123 } });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      errors.validation('Answer for question 1 has invalid type')
    );
    expect(next).not.toHaveBeenCalled();
  });
});