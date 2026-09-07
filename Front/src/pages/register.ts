import {  post } from "../api/client";
import { saveAuth } from "../utils/auth";
import type { PublicUser } from "../types";
import { navigateTo } from "../utils/router";
import { showToast } from "../components/toast";

export function renderRegister(){
    return `
    <div class="auth-form">
        <span class="form-title">Регистрация</span>
    <form id="register-form">
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Пароль" required>
        <input type="password" name="password-repeat" placeholder="Повторите пароль" required>
        <button type="submit">Зарегистрироваться</button>
    </form>
    <span>Уже есть аккаунт?
        <a href="/login" data-link>Войти</a>
    </span>
    </div>`
}

addEventListener('submit', async (e) => {
    if(!(e.target instanceof HTMLElement)){
      return; 
    }

    const form = e.target.closest('#register-form')
    if(!(form instanceof HTMLFormElement)){
        return;
    }

    e.preventDefault();
    
    const formData = new FormData(form)

    const password = formData.get('password')
    const passwordRepeat = formData.get('password-repeat')
    if(!(password === passwordRepeat)){
         showToast({
            message: 'Пароли не совпадают',
            type: 'error',
        });
        return;
    }

    const formDataObject = Object.fromEntries(formData.entries())

const result = await post<{token: string, user: PublicUser}>('/auth/registration', formDataObject)
if(!result.success){
   showToast({
            message: result.error,
            type: 'error',
        });
    return;
}
if(!result.data){
    showToast({
            message: 'Ошибка регистрации',
            type: 'error',
        });
    return;
}
saveAuth(result.data.token, result.data.user);
    showToast({
        message: 'Регистрация прошла успешно!',
        type: 'success',
    });
navigateTo('/profile');
})