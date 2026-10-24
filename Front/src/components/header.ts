import { isAuthenticated, getUser, logout } from '../utils/auth';
import { navigateTo } from '../utils/router';
import { showToast } from './toast';
import { escapeHtml } from '../utils/html';

export function renderHeader(): string {
  const isAuth = isAuthenticated();
  const user = getUser();

  const authBlock = isAuth
    ? `
      <span class="user-email">👤 ${escapeHtml(user?.email ?? 'User')}</span>
      <button id="logout-btn" class="logout-btn">Log out</button>
    `
    : `
      <a href="/login" data-link>Log in</a>
      <a href="/register" data-link>Register</a>
    `;

  return `
    <header class="header">
      <div class="header-left">
        <a href="/" data-link class="logo">
          <span class="logo-icon">📋</span> Survey App
        </a>
      </div>
      <nav class="header-nav">
        <a href="/" data-link>All surveys</a>
        ${isAuth ? '<a href="/profile" data-link>My surveys</a>' : ''}
      </nav>
      <div class="header-right">
        ${authBlock}
      </div>
    </header>
  `;
}

document.addEventListener('click', (e) => {
  if (!(e.target instanceof HTMLElement)) return;

  const btn = e.target.closest<HTMLButtonElement>('#logout-btn');
  if (!btn) return;

  e.preventDefault();
  logout();
  showToast({ message: 'You have logged out', type: 'info' });
  navigateTo('/login');
});