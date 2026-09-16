// src/components/header.ts
import { isAuthenticated, getUser, logout } from "../utils/auth";
import { navigateTo } from "../utils/router";
import { showToast } from "./toast";

export function renderHeader(): string {
    const isAuth = isAuthenticated();
    const user = getUser();

    return `
        <header class="header">
            <div class="header-left">
                <a href="/" data-link class="logo">
                    <span class="logo-icon">📋</span> Survey App
                </a>
            </div>
            <nav class="header-nav">
                <a href="/" data-link>Все опросы</a>
                ${isAuth ? `<a href="/profile" data-link>Мои опросы</a>` : ''}
            </nav>
            <div class="header-right">
                ${isAuth ? `
                    <span class="user-email">👤 ${user?.email || 'Пользователь'}</span>
                    <button id="logout-btn" class="logout-btn">Выйти</button>
                ` : `
                    <a href="/login" data-link>Войти</a>
                    <a href="/register" data-link>Регистрация</a>
                `}
            </div>
        </header>
    `;
}

// Обработчик выхода
document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'logout-btn') {
        e.preventDefault();
        logout();
        showToast({
            message: 'Вы вышли из аккаунта',
            type: 'info',
        });
        navigateTo('/login');
    }
});