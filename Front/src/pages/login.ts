import { post } from '../api/client';
import { saveAuth } from '../utils/auth';
import type { PublicUser } from '../types';
import { navigateTo } from '../utils/router';
import { showToast } from '../components/toast';
import { validateEmail } from '../utils/validators';
import { MAX_EMAIL_LENGTH, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '../constants';
import { withSubmitLock } from '../utils/form';

export function renderLogin(): string {
  return `
    <div class="auth-page">
      <div class="auth-form">
        <span class="form-title">Log in</span>
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
            placeholder="Password"
            minlength="${MIN_PASSWORD_LENGTH}"
            maxlength="${MAX_PASSWORD_LENGTH}"
            required
          >
          <button type="submit">Log in</button>
        </form>
        <span>Don't have an account? <a href="/register" data-link>Register</a></span>
      </div>
    </div>
  `;
}

document.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'login-form') return;

  e.preventDefault();

  await withSubmitLock(form, async () => {
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '').trim();

    const emailError = validateEmail(email);
    if (emailError) {
      showToast({ message: emailError, type: 'error' });
      return;
    }

    if (!password) {
      showToast({ message: 'Please enter a password', type: 'error' });
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
      showToast({ message: 'Login failed', type: 'error' });
      return;
    }

    saveAuth(result.data.token, result.data.user);
    showToast({ message: 'Welcome!', type: 'success' });
    navigateTo('/profile');
  });
});