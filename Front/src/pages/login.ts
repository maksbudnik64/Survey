import {  post } from "../api/client";
import { saveAuth } from "../utils/auth";
import type { PublicUser } from "../types";
import { navigateTo } from "../utils/router";
import { showToast } from "../components/toast";

export function renderLogin(): string{
    return `
    <div class="auth-form">
        <span class="form-title">Вход</span>
    <form id="login-form">
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Пароль" required>
        <button type="submit">Войти</button>
    </form>
    <span>Нет аккаунта?
        <a href="/register" data-link>Зарегистрироваться</a>
    </span>
    </div>`
}

addEventListener('submit', async (e)=>{
if(!(e.target instanceof HTMLElement)){
    return;
}

const form = e.target.closest('#login-form')
if(!(form instanceof HTMLFormElement)){
    return;
}

e.preventDefault();

    const formData = new FormData(form);
    const formDataObject = Object.fromEntries(formData.entries())

const result = await post<{token: string, user: PublicUser}>('/auth/login', formDataObject)
if(!result.success){
    showToast({
            message: result.error,
            type: 'error',
        });
    return;
}
if(!result.data){
    showToast({
            message: 'Ошибка входа',
            type: 'error',
        });
    return;
}
saveAuth(result.data.token, result.data.user);
    showToast({
        message: 'Добро пожаловать!',
        type: 'success',
    });

navigateTo('/profile');
})