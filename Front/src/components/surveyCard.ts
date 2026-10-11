import type { Survey } from "../types";
import { navigateTo } from "../utils/router";
import { showToast } from "./toast";
import { pluralizeAnswers } from "../utils/pluralize";

export function renderSurveyCard(survey: Survey): string {
    const url = `${window.location.origin}/survey/${survey.id}`;

    return `
        <div class="survey-card card" data-survey-id="${survey.id}">
            <h3 class="survey-title">${survey.title}</h3>
            <div class="survey-meta">
                <span class="survey-date">📅 ${formatDate(survey.created_at)}</span>
                <span class="survey-answers">📊 ${pluralizeAnswers(survey.answers_counter)}</span>
            </div>
            <div class="survey-actions">
                <button class="copy-btn" data-url="${url}">📋 Копировать ссылку</button>
                <button class="survey-go-btn" data-id="${survey.id}">Перейти →</button>
            </div>
        </div>
    `;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains('copy-btn')) {
        const url = target.getAttribute('data-url');
        if (url) {
            navigator.clipboard.writeText(url)
                .then(() => {
                    showToast({ message: 'Ссылка скопирована! ✅', type: 'success' });
                })
                .catch(() => {
                    showToast({ message: 'Не удалось скопировать', type: 'error' });
                });
        }
    }

    if (target.classList.contains('survey-go-btn')) {
        const id = target.getAttribute('data-id');
        if (id) {
            navigateTo(`/survey/${id}`);
        }
    }
});