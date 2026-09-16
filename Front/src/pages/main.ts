// src/pages/main.ts
import { get } from "../api/client";
import { renderHeader } from "../components/header";
import { renderSurveyCard } from "../components/surveyCard";
import { showToast } from "../components/toast";
import type { Survey } from "../types";

export async function renderMain(): Promise<string> {
    const header = renderHeader();

    const result = await get<Survey[]>('/surveys');

    let content = '';
    if (!result.success) {
        showToast({
            message: result.error || 'Ошибка загрузки опросов',
            type: 'error',
        });
        content = `<p class="error">Не удалось загрузить опросы</p>`;
    } else if (!result.data || result.data.length === 0) {
        content = `<p class="empty">Пока нет опросов. Будьте первым!</p>`;
    } else {
        const cards = result.data.map(survey => renderSurveyCard(survey)).join('');
        content = `<div class="grid">${cards}</div>`;
    }

    return `
        ${header}
        <main class="main-content">
            <h1>Все опросы</h1>
            ${content}
        </main>
    `;
}