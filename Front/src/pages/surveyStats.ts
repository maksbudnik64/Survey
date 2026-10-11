import { get } from "../api/client";
import { renderHeader } from "../components/header";
import { showToast } from "../components/toast";
import { navigateTo } from "../utils/router";
import { SurveyStatsRenderer, type QuestionStats } from "../components/surveyStatsRenderer";
import type { SurveyWithQuestions, Answer, Question, ChoiceQuestion } from "../types";

export function renderSurveyStats(): string {
    return `
        ${renderHeader()}
        <main class="main-content">
            <div class="page-header">
                <h1 id="survey-title">Статистика</h1>
                <div class="page-tabs">
                    <button class="tab" id="edit-tab-btn">✏️ Редактирование</button>
                    <button class="tab active" data-tab="stats">📊 Статистика</button>
                </div>
            </div>
            <div id="stats-container">Загрузка...</div>
            <button id="back-btn" class="secondary" style="margin-top: 1rem;">← Назад</button>
        </main>
    `;
}

function isChoiceQuestion(q: Question): q is ChoiceQuestion {
    return q.type === 'single_choice' || q.type === 'multiple_choice';
}

export async function initSurveyStatsPage(surveyId: number) {
    document.getElementById('edit-tab-btn')?.addEventListener('click', () => {
        navigateTo(`/survey/${surveyId}/edit`);
    });

    const surveyResult = await get<SurveyWithQuestions>(`/surveys/${surveyId}`);

    if (!surveyResult.success) {
        showToast({ message: surveyResult.error, type: 'error' });
        navigateTo('/profile', true);
        return;
    }

    if (!surveyResult.data) {
        showToast({ message: 'Опрос не найден', type: 'error' });
        navigateTo('/profile', true);
        return;
    }

    const survey = surveyResult.data;

    const answersResult = await get<Answer[]>(`/surveys/responses/${surveyId}`);

    if (!answersResult.success) {
        showToast({ message: answersResult.error, type: 'error' });
        return;
    }

    const answers = answersResult.data || [];
    const totalResponses = answers.length;

    const stats: QuestionStats[] = survey.questions
        .filter((q): q is Question & { id: number } => q.id !== undefined)
        .map(q => {
            const counts = new Map<string, number>();

            if (isChoiceQuestion(q)) {
                for (const opt of q.options) {
                    counts.set(opt, 0);
                }
            }

            for (const answer of answers) {
                const value = answer.answers[q.id];
                if (value === undefined || value === null) continue;

                if (Array.isArray(value)) {
                    for (const v of value) {
                        counts.set(v, (counts.get(v) || 0) + 1);
                    }
                } else {
                    counts.set(value, (counts.get(value) || 0) + 1);
                }
            }

            const options = Array.from(counts.entries()).map(([label, count]) => ({
                label,
                count,
                percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
            }));

            return {
                questionId: q.id,
                questionText: q.text,
                type: q.type,
                total: totalResponses,
                options,
            };
        });

    const titleEl = document.getElementById('survey-title');
    if (titleEl) titleEl.textContent = `Статистика: ${survey.title}`;

    const renderer = new SurveyStatsRenderer(survey.questions, stats, totalResponses);
    const container = document.getElementById('stats-container');
    if (container) container.innerHTML = renderer.render();

    document.getElementById('back-btn')?.addEventListener('click', () => {
        navigateTo('/profile', true);
    });
}