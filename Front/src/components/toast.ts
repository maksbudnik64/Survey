import { escapeHtml } from '../utils/html';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
};

const DEFAULT_DURATION = 3000;
const FADE_OUT_DURATION = 300;

export function showToast({
  message,
  type,
  duration = DEFAULT_DURATION,
}: ToastOptions): void {
  document.querySelector('.toast-container')?.remove();

  const container = document.createElement('div');
  container.className = 'toast-container';

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type]}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Закрыть">&times;</button>
  `;

  container.appendChild(toast);
  document.body.appendChild(container);

  let timeout: ReturnType<typeof setTimeout>;
  let removed = false;

  const remove = (): void => {
    if (removed) return;
    removed = true;
    clearTimeout(timeout);
    container.classList.add('toast-fade-out');
    setTimeout(() => container.remove(), FADE_OUT_DURATION);
  };

  toast.querySelector('.toast-close')?.addEventListener('click', remove);

  timeout = setTimeout(remove, duration);

  toast.addEventListener('mouseenter', () => clearTimeout(timeout));
  toast.addEventListener('mouseleave', () => {
    timeout = setTimeout(remove, duration);
  });
}