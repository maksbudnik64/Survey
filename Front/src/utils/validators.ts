import {
  MAX_EMAIL_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_QUESTION_TEXT_LENGTH,
  MAX_OPTION_LENGTH,
} from '../constants';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (email.length > MAX_EMAIL_LENGTH) return `Email must be up to ${MAX_EMAIL_LENGTH} characters`;
  if (!isValidEmail(email)) return 'Invalid email format';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  if (password.length > MAX_PASSWORD_LENGTH)
    return `Password must be up to ${MAX_PASSWORD_LENGTH} characters`;
  return null;
}

export function validateTitle(title: string): string | null {
  if (!title) return 'Title is required';
  if (title.length > MAX_TITLE_LENGTH) return `Title must be up to ${MAX_TITLE_LENGTH} characters`;
  return null;
}

export function validateQuestionText(text: string): string | null {
  if (!text) return 'Question text is required';
  if (text.length > MAX_QUESTION_TEXT_LENGTH)
    return `Question text must be up to ${MAX_QUESTION_TEXT_LENGTH} characters`;
  return null;
}

export function validateOption(option: string): string | null {
  if (!option) return 'Option cannot be empty';
  if (option.length > MAX_OPTION_LENGTH)
    return `Option must be up to ${MAX_OPTION_LENGTH} characters`;
  return null;
}