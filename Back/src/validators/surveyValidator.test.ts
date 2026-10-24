import { describe, expect, it } from 'vitest';
import { runValidator } from '../test/mocks.ts';
import {
  MAX_OPTION_LENGTH,
  MAX_OPTIONS,
  MAX_QUESTION_TEXT_LENGTH,
  MAX_QUESTIONS,
  MAX_TITLE_LENGTH,
} from '../constants.ts';
import { validateQuestion, validateSurvey } from './surveyValidator.ts';

describe('validateSurvey', () => {
  it('rejects when title is missing', () => {
    const { res, next } = runValidator(validateSurvey, { questions: [] });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Survey title is required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when title is not a string', () => {
    const { res, next } = runValidator(validateSurvey, { title: 123, questions: [] });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Title must be a string',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when title is only whitespace', () => {
    const { res, next } = runValidator(validateSurvey, { title: '   ', questions: [] });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Title cannot be empty',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when title exceeds max length', () => {
    const longTitle = 'a'.repeat(MAX_TITLE_LENGTH + 1);

    const { res, next } = runValidator(validateSurvey, { title: longTitle, questions: [] });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: `Title must be up to ${MAX_TITLE_LENGTH} chars`,
      code: 'VALIDATION_ERROR',
    });
  });

  it('accepts a title of exactly MAX_TITLE_LENGTH', () => {
    const title = 'a'.repeat(MAX_TITLE_LENGTH);

    const { res, next } = runValidator(validateSurvey, {
      title,
      questions: [{ text: 'Q', type: 'text' }],
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects when questions are missing', () => {
    const { res, next } = runValidator(validateSurvey, { title: 'Valid Title' });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Questions are required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when questions is null', () => {
    const { res, next } = runValidator(validateSurvey, {
      title: 'Valid Title',
      questions: null,
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Questions are required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when questions are not an array', () => {
    const { res, next } = runValidator(validateSurvey, {
      title: 'Valid Title',
      questions: 'not an array',
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Questions must be an array',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects an empty questions array', () => {
    const { res, next } = runValidator(validateSurvey, { title: 'Valid Title', questions: [] });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'At least one question is required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when questions exceed max count', () => {
    const questions = Array.from({ length: MAX_QUESTIONS + 1 }, () => ({
      text: 'Question',
      type: 'text',
    }));

    const { res, next } = runValidator(validateSurvey, { title: 'Valid Title', questions });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: `Max ${MAX_QUESTIONS} questions allowed`,
      code: 'VALIDATION_ERROR',
    });
  });

  it('accepts exactly MAX_QUESTIONS questions', () => {
    const questions = Array.from({ length: MAX_QUESTIONS }, () => ({
      text: 'Question',
      type: 'text',
    }));

    const { res, next } = runValidator(validateSurvey, { title: 'Valid Title', questions });

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects when a question is not an object', () => {
    const { res, next } = runValidator(validateSurvey, {
      title: 'Valid Title',
      questions: ['not an object'],
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Question 1: must be an object',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when a question is missing type', () => {
    const { res, next } = runValidator(validateSurvey, {
      title: 'Valid Title',
      questions: [{ text: 'Question 1' }],
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Question 1: type is required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when a question is missing text', () => {
    const { res, next } = runValidator(validateSurvey, {
      title: 'Valid Title',
      questions: [{ type: 'text' }],
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Question 1: text is required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when a question has empty-string text (not just whitespace)', () => {
    const { res, next } = runValidator(validateSurvey, {
      title: 'Valid Title',
      questions: [{ text: '', type: 'text' }],
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Question 1: text cannot be empty',
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects when a question has empty-string type', () => {
    const { res, next } = runValidator(validateSurvey, {
      title: 'Valid Title',
      questions: [{ text: 'Question 1', type: '' }],
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Question 1: invalid type ""',
      code: 'VALIDATION_ERROR',
    });
  });

  it('normalizes title and question text on success', () => {
    const question = { text: '   Question 1   ', type: 'text' };

    const { req, res, next } = runValidator(validateSurvey, {
      title: '   Valid Title   ',
      questions: [question],
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body.title).toBe('Valid Title');
    expect(question.text).toBe('Question 1');
  });
});

describe('validateQuestion', () => {
  it('rejects a non-object value', () => {
    expect(validateQuestion('not an object', 0)).toBe('Question 1: must be an object');
    expect(validateQuestion(null, 0)).toBe('Question 1: must be an object');
    expect(validateQuestion(undefined, 0)).toBe('Question 1: must be an object');
  });

  it('uses 1-based index in error messages', () => {
    expect(validateQuestion(null, 4)).toBe('Question 5: must be an object');
  });

  it('rejects when text is undefined', () => {
    expect(validateQuestion({ type: 'text' }, 0)).toBe('Question 1: text is required');
  });

  it('rejects when text is null', () => {
    expect(validateQuestion({ text: null, type: 'text' }, 0)).toBe(
      'Question 1: text is required'
    );
  });

  it('rejects when text is not a string', () => {
    expect(validateQuestion({ text: 123, type: 'text' }, 0)).toBe(
      'Question 1: text must be a string'
    );
  });

  it('rejects when text is an empty string', () => {
    expect(validateQuestion({ text: '', type: 'text' }, 0)).toBe(
      'Question 1: text cannot be empty'
    );
  });

  it('rejects when text is whitespace only', () => {
    expect(validateQuestion({ text: '   ', type: 'text' }, 0)).toBe(
      'Question 1: text cannot be empty'
    );
  });

  it('rejects when text exceeds max length', () => {
    const longText = 'a'.repeat(MAX_QUESTION_TEXT_LENGTH + 1);

    expect(validateQuestion({ text: longText, type: 'text' }, 0)).toBe(
      `Question 1: text must be up to ${MAX_QUESTION_TEXT_LENGTH} chars`
    );
  });

  it('rejects when type is undefined', () => {
    expect(validateQuestion({ text: 'Question 1' }, 0)).toBe('Question 1: type is required');
  });

  it('rejects when type is null', () => {
    expect(validateQuestion({ text: 'Question 1', type: null }, 0)).toBe(
      'Question 1: type is required'
    );
  });

  it('rejects when type is not a string', () => {
    expect(validateQuestion({ text: 'Question 1', type: 123 }, 0)).toBe(
      'Question 1: type must be a string'
    );
  });

  it('rejects empty-string type as invalid', () => {
    expect(validateQuestion({ text: 'Question 1', type: '' }, 0)).toBe(
      'Question 1: invalid type ""'
    );
  });

  it('rejects unknown type and quotes it in the message', () => {
    expect(
      validateQuestion({ text: 'Question 1', type: 'unknown_type', options: ['Option'] }, 0)
    ).toBe('Question 1: invalid type "unknown_type"');
  });

  it('safely escapes quotes in unknown type', () => {
    expect(
      validateQuestion({ text: 'Question 1', type: 'foo"bar', options: ['Option'] }, 0)
    ).toBe('Question 1: invalid type "foo\\"bar"');
  });

  it('accepts a valid text question and trims its text', () => {
    const question = { text: '   Question 1   ', type: 'text' };

    const error = validateQuestion(question, 0);

    expect(error).toBeNull();
    expect(question.text).toBe('Question 1');
  });

  it('rejects choice question when options are missing', () => {
    expect(validateQuestion({ text: 'Question 1', type: 'single_choice' }, 0)).toBe(
      'Question 1: options are required'
    );
  });

  it('rejects choice question when options are not an array', () => {
    expect(
      validateQuestion({ text: 'Question 1', type: 'single_choice', options: 'not an array' }, 0)
    ).toBe('Question 1: options must be an array');
  });

  it('rejects choice question with empty options', () => {
    expect(validateQuestion({ text: 'Question 1', type: 'single_choice', options: [] }, 0)).toBe(
      'Question 1: at least one option required'
    );
  });

  it('rejects choice question with too many options', () => {
    const options = Array(MAX_OPTIONS + 1).fill('Option');

    expect(
      validateQuestion({ text: 'Question 1', type: 'single_choice', options }, 0)
    ).toBe(`Question 1: max ${MAX_OPTIONS} options allowed`);
  });

  it('accepts exactly MAX_OPTIONS options', () => {
    const question = {
      text: 'Question 1',
      type: 'single_choice' as const,
      options: Array.from({ length: MAX_OPTIONS }, (_, i) => `Option ${i}`),
    };

    expect(validateQuestion(question, 0)).toBeNull();
  });

  it('rejects when an option is not a string', () => {
    expect(
      validateQuestion({ text: 'Question 1', type: 'single_choice', options: [123] }, 0)
    ).toBe('Question 1: option 1 must be a string');
  });

  it('rejects when an option is an empty string', () => {
    expect(
      validateQuestion({ text: 'Question 1', type: 'single_choice', options: [''] }, 0)
    ).toBe('Question 1: option 1 cannot be empty');
  });

  it('rejects when an option is whitespace only', () => {
    expect(
      validateQuestion({ text: 'Question 1', type: 'single_choice', options: ['   '] }, 0)
    ).toBe('Question 1: option 1 cannot be empty');
  });

  it('rejects when an option exceeds max length', () => {
    const longOption = 'a'.repeat(MAX_OPTION_LENGTH + 1);

    expect(
      validateQuestion({ text: 'Question 1', type: 'single_choice', options: [longOption] }, 0)
    ).toBe(`Question 1: option 1 must be up to ${MAX_OPTION_LENGTH} chars`);
  });

  it('uses 1-based index for option errors', () => {
    expect(
      validateQuestion({ text: 'Question 1', type: 'single_choice', options: ['ok', 123] }, 0)
    ).toBe('Question 1: option 2 must be a string');
  });

  it('rejects duplicated options', () => {
    expect(
      validateQuestion({ text: 'Question 1', type: 'single_choice', options: ['A', 'B', 'A'] }, 0)
    ).toBe('Question 1: option 3 is duplicated');
  });

  it('rejects options that become duplicates after trimming', () => {
    expect(
      validateQuestion(
        { text: 'Question 1', type: 'single_choice', options: ['A', ' A '] },
        0
      )
    ).toBe('Question 1: option 2 is duplicated');
  });

  it('treats differently-cased options as distinct', () => {
    const question = {
      text: 'Question 1',
      type: 'single_choice' as const,
      options: ['A', 'a'],
    };

    expect(validateQuestion(question, 0)).toBeNull();
  });

  it('accepts a valid single_choice question and normalizes it', () => {
    const question = {
      text: '   Question 1   ',
      type: 'single_choice' as const,
      options: ['   Option 1   ', '  Option 2  '],
    };

    const error = validateQuestion(question, 0);

    expect(error).toBeNull();
    expect(question.text).toBe('Question 1');
    expect(question.options).toEqual(['Option 1', 'Option 2']);
  });

  it('accepts a valid multiple_choice question', () => {
    const question = {
      text: 'Question 1',
      type: 'multiple_choice' as const,
      options: ['A', 'B'],
    };

    expect(validateQuestion(question, 0)).toBeNull();
  });
});