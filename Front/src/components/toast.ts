// src/components/Toast.ts

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
    message: string;
    type: ToastType;
    duration?: number; // в миллисекундах
}

export function showToast({ message, type, duration = 3000 }: ToastOptions): void {
    // Удаляем старые тосты, если есть
    const existing = document.querySelector('.toast-container');
    if (existing) {
        existing.remove();
    }

    // Создаём контейнер
    const container = document.createElement('div');
    container.className = 'toast-container';

    // Создаём сам тост
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Иконка в зависимости от типа
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);
    document.body.appendChild(container);

    // Закрытие по кнопке
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', () => {
        removeToast(container);
    });

    // Автоматическое закрытие
    const timeout = setTimeout(() => {
        removeToast(container);
    }, duration);

    // Останавливаем таймер при наведении
    toast.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
    });

    toast.addEventListener('mouseleave', () => {
        setTimeout(() => {
            removeToast(container);
        }, duration);
    });
}

function removeToast(container: HTMLElement): void {
    container.classList.add('toast-fade-out');
    setTimeout(() => {
        container.remove();
    }, 300);
}