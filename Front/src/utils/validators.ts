import {
    MAX_EMAIL_LENGTH,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
    MAX_TITLE_LENGTH,
    MAX_QUESTION_TEXT_LENGTH,
    MAX_OPTION_LENGTH,
} from "../constants";

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateEmail(email: string): string | null {
    if (!email) return "Email обязателен";
    if (email.length > MAX_EMAIL_LENGTH) return `Email не более ${MAX_EMAIL_LENGTH} символов`;
    if (!isValidEmail(email)) return "Некорректный формат email";
    return null;
}

export function validatePassword(password: string): string | null {
    if (!password) return "Пароль обязателен";
    if (password.length < MIN_PASSWORD_LENGTH) return `Пароль минимум ${MIN_PASSWORD_LENGTH} символов`;
    if (password.length > MAX_PASSWORD_LENGTH) return `Пароль не более ${MAX_PASSWORD_LENGTH} символов`;
    return null;
}

export function validateTitle(title: string): string | null {
    if (!title) return "Название обязательно";
    if (title.length > MAX_TITLE_LENGTH) return `Название не более ${MAX_TITLE_LENGTH} символов`;
    return null;
}

export function validateQuestionText(text: string): string | null {
    if (!text) return "Текст вопроса обязателен";
    if (text.length > MAX_QUESTION_TEXT_LENGTH) return `Текст не более ${MAX_QUESTION_TEXT_LENGTH} символов`;
    return null;
}

export function validateOption(option: string): string | null {
    if (!option) return "Вариант не может быть пустым";
    if (option.length > MAX_OPTION_LENGTH) return `Вариант не более ${MAX_OPTION_LENGTH} символов`;
    return null;
}