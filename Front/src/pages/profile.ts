// src/pages/main.ts
import { get } from "../api/client";
import { renderHeader } from "../components/header";
import { renderSurveyCard } from "../components/surveyCard";
import { showToast } from "../components/toast";
import { navigateTo } from "../utils/router";
import type { Survey } from "../types";

export async function renderProfile(): Promise<string> {
    const header = renderHeader();

    const result = await get<Survey[]>('/surveys/mySurveys');

    let content = '';
    if (!result.success) {
        showToast({
            message: result.error || 'Ошибка загрузки опросов',
            type: 'error',
        });
        content = `<p class="error">Не удалось загрузить опросы</p>`;
    } else if (!result.data || result.data.length === 0) {
        content = `
            <p class="empty">Пока нет опросов. Создайте первый опрос!</p>
            <div style="text-align: center; margin-top: 1.5rem;">
                <button id="create-survey-btn" class="primary">Создать опрос</button>
            </div>
        `;
    } else {
        const cards = result.data.map(survey => renderSurveyCard(survey)).join('');
        content = `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 1.5rem;">
                <button id="create-survey-btn" class="primary">Создать опрос</button>
            </div>
            <div class="grid">${cards}</div>
        `;
    }

    return `
        ${header}
        <main class="main-content">
            <h1>Мои опросы</h1>
            ${content}
        </main>
    `;
}

// Обработчик клика по кнопке "Создать опрос"
document.addEventListener('click', (e) => {
    const target = e.target;
    if(!(target instanceof HTMLElement)){
        return;
    }
    if (target.id === 'create-survey-btn') {
        navigateTo('/survey/create');
    }
});