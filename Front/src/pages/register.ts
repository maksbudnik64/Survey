// Front/src/pages/register.ts
import { post } from "../api/client";
import { saveAuth } from "../utils/auth";
import type { PublicUser } from "../types";
import { navigateTo } from "../utils/router";
import { showToast } from "../components/toast";
import { validateEmail, validatePassword } from "../utils/validators";
import {
    MAX_EMAIL_LENGTH,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
} from "../constants";

export function renderRegister() {
    return `
    <div class="auth-page">
    <div class="auth-form">
        <span class="form-title">Регистрация</span>
    <form id="register-form">
        <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            maxlength="${MAX_EMAIL_LENGTH}"
            required
        >
        <input 
            type="password" 
            name="password" 
            placeholder="Пароль (${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} символов)" 
            minlength="${MIN_PASSWORD_LENGTH}"
            maxlength="${MAX_PASSWORD_LENGTH}"
            required
        >
        <input 
            type="password" 
            name="password-repeat" 
            placeholder="Повторите пароль" 
            minlength="${MIN_PASSWORD_LENGTH}"
            maxlength="${MAX_PASSWORD_LENGTH}"
            required
        >
        <button type="submit">Зарегистрироваться</button>
    </form>
    <span>Уже есть аккаунт?
        <a href="/login" data-link>Войти</a>
    </span>
    </div>
    </div>`;
}

addEventListener('submit', async (e) => {
    if (!(e.target instanceof HTMLElement)) return;

    const form = e.target.closest('#register-form');
    if (!(form instanceof HTMLFormElement)) return;

    e.preventDefault();

    const formData = new FormData(form);
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const password = (formData.get('password') as string || '').trim();
    const passwordRepeat = (formData.get('password-repeat') as string || '').trim();

    const emailError = validateEmail(email);
    if (emailError) {
        showToast({ message: emailError, type: 'error' });
        return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        showToast({ message: passwordError, type: 'error' });
        return;
    }

    if (password !== passwordRepeat) {
        showToast({ message: 'Пароли не совпадают', type: 'error' });
        return;
    }

    const result = await post<{ token: string; user: PublicUser }>('/auth/registration', {
        email,
        password,
    });

    if (!result.success) {
        showToast({ message: result.error, type: 'error' });
        return;
    }

    if (!result.data) {
        showToast({ message: 'Ошибка регистрации', type: 'error' });
        return;
    }

    saveAuth(result.data.token, result.data.user);
    showToast({ message: 'Регистрация прошла успешно!', type: 'success' });
    navigateTo('/profile');
});