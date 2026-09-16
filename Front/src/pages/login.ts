// Front/src/pages/login.ts
import { post } from "../api/client";
import { saveAuth } from "../utils/auth";
import type { PublicUser } from "../types";
import { navigateTo } from "../utils/router";
import { showToast } from "../components/toast";
import { validateEmail } from "../utils/validators";
import { MAX_EMAIL_LENGTH, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "../constants";

export function renderLogin(): string {
    return `
    <div class="auth-page">
    <div class="auth-form">
        <span class="form-title">Вход</span>
    <form id="login-form">
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
            placeholder="Пароль" 
            minlength="${MIN_PASSWORD_LENGTH}"
            maxlength="${MAX_PASSWORD_LENGTH}"
            required
        >
        <button type="submit">Войти</button>
    </form>
    <span>Нет аккаунта?
        <a href="/register" data-link>Зарегистрироваться</a>
    </span>
    </div>
    </div>`;
}

addEventListener('submit', async (e) => {
    if (!(e.target instanceof HTMLElement)) return;

    const form = e.target.closest('#login-form');
    if (!(form instanceof HTMLFormElement)) return;

    e.preventDefault();

    const formData = new FormData(form);
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const password = (formData.get('password') as string || '').trim();

    const emailError = validateEmail(email);
    if (emailError) {
        showToast({ message: emailError, type: 'error' });
        return;
    }

    if (!password) {
        showToast({ message: 'Введите пароль', type: 'error' });
        return;
    }

    const result = await post<{ token: string; user: PublicUser }>('/auth/login', {
        email,
        password,
    });

    if (!result.success) {
        showToast({ message: result.error, type: 'error' });
        return;
    }

    if (!result.data) {
        showToast({ message: 'Ошибка входа', type: 'error' });
        return;
    }

    saveAuth(result.data.token, result.data.user);
    showToast({ message: 'Добро пожаловать!', type: 'success' });
    navigateTo('/profile');
});