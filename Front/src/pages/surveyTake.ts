import { get, post } from "../api/client";
import { renderHeader } from "../components/header";
import { showToast } from "../components/toast";
import { navigateTo } from "../utils/router";
import { SurveyTakerRenderer } from "../components/surveyTakerRenderer";
import type { SurveyWithQuestions } from "../types";

export function renderSurveyTake(): string {
    return `
        ${renderHeader()}
        <main class="main-content">
            <h1 id="survey-title">Загрузка...</h1>
            <form id="survey-form">
                <div id="questions-container"></div>
                <button type="submit" class="primary" style="width: 100%; margin-top: 1rem;">
                    Отправить ответы
                </button>
            </form>
        </main>
    `;
}

export async function initSurveyTakePage(surveyId: number) {
    const result = await get<SurveyWithQuestions>(`/surveys/${surveyId}`);

    if (!result.success) {
        showToast({ message: result.error, type: 'error' });
        navigateTo('/');
        return;
    }

    if (!result.data) {
        showToast({ message: 'Опрос не найден', type: 'error' });
        navigateTo('/');
        return;
    }

    const survey = result.data;

    const titleEl = document.getElementById('survey-title');
    if (titleEl) titleEl.textContent = survey.title;

    const renderer = new SurveyTakerRenderer(survey.questions);
    const container = document.getElementById('questions-container');
    if (container) container.innerHTML = renderer.render();

    document.getElementById('survey-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const answers: Record<string, string | string[]> = {};
        let hasError = false;

        for (const q of survey.questions) {
            if (q.id === undefined) continue;

            if (q.type === 'text') {
                const input = document.querySelector(
                    `.answer-input[data-question-id="${q.id}"]`
                ) as HTMLInputElement;
                const value = input?.value.trim() || '';

                if (!value) {
                    showToast({ message: `Вопрос ${q.id}: введите ответ`, type: 'error' });
                    hasError = true;
                    break;
                }

                answers[q.id] = value;
            } else if (q.type === 'single_choice') {
                const checked = document.querySelector(
                    `input[name="question-${q.id}"]:checked`
                ) as HTMLInputElement;

                if (!checked) {
                    showToast({ message: 'Выберите вариант ответа', type: 'error' });
                    hasError = true;
                    break;
                }

                answers[q.id] = checked.value;
            } else if (q.type === 'multiple_choice') {
                const checked = document.querySelectorAll(
                    `input[name="question-${q.id}"]:checked`
                );

                if (checked.length === 0) {
                    showToast({ message: 'Выберите хотя бы один вариант', type: 'error' });
                    hasError = true;
                    break;
                }

                answers[q.id] = Array.from(checked).map((c: any) => c.value);
            }
        }

        if (hasError) return;

        const submitResult = await post(`/surveys/${surveyId}/responses`, { answers });

        if (!submitResult.success) {
            showToast({ message: submitResult.error, type: 'error' });
            return;
        }

        showToast({ message: 'Спасибо! Ответы отправлены 🎉', type: 'success' });
        navigateTo('/');
    });
}