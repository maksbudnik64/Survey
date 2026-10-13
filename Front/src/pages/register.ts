import { post } from '../api/client';
import { saveAuth } from '../utils/auth';
import type { PublicUser } from '../types';
import { navigateTo } from '../utils/router';
import { showToast } from '../components/toast';
import { validateEmail, validatePassword } from '../utils/validators';
import {
  MAX_EMAIL_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '../constants';
import { withSubmitLock } from '../utils/form';

export function renderRegister(): string {
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
            placeholder="Пароль"
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
        <span>Уже есть аккаунт? <a href="/login" data-link>Войти</a></span>
      </div>
    </div>
  `;
}

document.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'register-form') return;

  e.preventDefault();

  await withSubmitLock(form, async () => {
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '').trim();
    const passwordRepeat = String(formData.get('password-repeat') ?? '').trim();

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
});