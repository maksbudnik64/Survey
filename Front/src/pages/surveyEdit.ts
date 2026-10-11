import { get, put, del } from "../api/client";
import { renderHeader } from "../components/header";
import { showToast } from "../components/toast";
import { navigateTo } from "../utils/router";
import { SurveyEditorRenderer } from "../components/surveyEditorRenderer";
import type { SurveyWithQuestions, Question, ChoiceQuestion } from "../types";
import {
    MAX_TITLE_LENGTH,
    MAX_QUESTION_TEXT_LENGTH,
    MAX_OPTION_LENGTH,
    MAX_QUESTIONS,
    MAX_OPTIONS,
} from "../constants";

let questions: Question[] = [];
let currentSurveyId: number | null = null;

function isChoiceQuestion(q: Question): q is ChoiceQuestion {
    return q.type === 'single_choice' || q.type === 'multiple_choice';
}

export function renderSurveyEdit(): string {
    return `
        ${renderHeader()}
        <main class="main-content">
            <div class="page-header">
                <h1>Редактирование опроса</h1>
                <div class="page-tabs">
                    <button class="tab active" data-tab="edit">✏️ Редактирование</button>
                    <button class="tab" id="stats-tab-btn">📊 Статистика</button>
                </div>
            </div>
            <form id="edit-survey-form" class="create-survey-form">
                <div class="form-group">
                    <label for="survey-title">Название опроса</label>
                    <div class="input-with-counter">
                        <textarea 
                            id="survey-title" 
                            placeholder="Название" 
                            maxlength="${MAX_TITLE_LENGTH}" 
                            rows="1"
                            required
                        ></textarea>
                        <span class="char-counter" id="title-counter">0 / ${MAX_TITLE_LENGTH}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Вопросы</label>
                    <div id="questions-container"></div>
                    <button type="button" id="add-question-btn" class="secondary">+ Добавить вопрос</button>
                </div>
                <button type="submit" class="primary" style="width: 100%; margin-top: 1rem;">
                    Сохранить изменения
                </button>
                <button type="button" id="delete-survey-btn" class="danger" style="width: 100%; margin-top: 0.75rem;">
                    Удалить опрос
                </button>
            </form>
        </main>
    `;
}

export async function initSurveyEditPage(surveyId: number) {
    currentSurveyId = surveyId;

    document.getElementById('stats-tab-btn')?.addEventListener('click', () => {
        navigateTo(`/survey/${surveyId}/stats`);
    });

    document.getElementById('delete-survey-btn')?.addEventListener('click', handleDelete);

    const result = await get<SurveyWithQuestions>(`/surveys/${surveyId}`);

    if (!result.success) {
        showToast({ message: result.error, type: 'error' });
        navigateTo('/profile');
        return;
    }

    if (!result.data) {
        showToast({ message: 'Опрос не найден', type: 'error' });
        navigateTo('/profile');
        return;
    }

    const survey = result.data;

    const titleInput = document.getElementById('survey-title') as HTMLTextAreaElement;
    const titleCounter = document.getElementById('title-counter');
    if (titleInput) {
        titleInput.value = survey.title;
        if (titleCounter) {
            titleCounter.textContent = `${survey.title.length} / ${MAX_TITLE_LENGTH}`;
        }
        titleInput.addEventListener('input', () => {
            if (titleCounter) {
                titleCounter.textContent = `${titleInput.value.length} / ${MAX_TITLE_LENGTH}`;
            }
        });
    }

    questions = survey.questions;
    renderQuestions();

    // 👇 Локальные слушатели (без document)
    const addBtn = document.getElementById('add-question-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addQuestion);
    }

    const form = document.getElementById('edit-survey-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    if (!container) return;

    const renderer = new SurveyEditorRenderer(questions);
    container.innerHTML = renderer.render();

    attachListeners(container);
}

function attachListeners(container: HTMLElement) {
    // Ввод текста вопроса
    container.querySelectorAll('.question-text').forEach((textarea) => {
        textarea.addEventListener('input', (e) => {
            const block = (e.target as HTMLElement).closest('.question-block') as HTMLElement | null;
            if (!block) return;
            const index = parseInt(block.dataset.index || '0');
            if (!questions[index]) return;

            const value = (e.target as HTMLTextAreaElement).value;
            questions[index].text = value;

            const counter = block.querySelector('.char-counter');
            if (counter) counter.textContent = `${value.length} / ${MAX_QUESTION_TEXT_LENGTH}`;
        });
    });

    // Ввод опции
    container.querySelectorAll('.option-input').forEach((textarea) => {
        textarea.addEventListener('input', (e) => {
            const row = (e.target as HTMLElement).closest('.option-row') as HTMLElement | null;
            if (!row) return;
            const qi = parseInt(row.getAttribute('data-question-index') || '0');
            const oi = parseInt(row.getAttribute('data-option-index') || '0');
            if (!questions[qi]) return;

            const question = questions[qi];
            if (isChoiceQuestion(question)) {
                question.options[oi] = (e.target as HTMLTextAreaElement).value;
            }

            const counter = row.querySelector('.option-counter');
            if (counter) {
                counter.textContent = `${(e.target as HTMLTextAreaElement).value.length} / ${MAX_OPTION_LENGTH}`;
            }
        });
    });

    // Смена типа
    container.querySelectorAll('.question-type').forEach((select) => {
        select.addEventListener('change', (e) => {
            const block = (e.target as HTMLElement).closest('.question-block') as HTMLElement | null;
            if (!block) return;
            const index = parseInt(block.dataset.index || '0');
            if (!questions[index]) return;
            const newType = (e.target as HTMLSelectElement).value;

            if (newType === 'text') {
                questions[index] = {
                    id: questions[index].id,
                    type: 'text',
                    text: questions[index].text,
                };
            } else if (newType === 'single_choice' || newType === 'multiple_choice') {
                const existingOptions = isChoiceQuestion(questions[index])
                    ? questions[index].options
                    : [];
                questions[index] = {
                    id: questions[index].id,
                    type: newType,
                    text: questions[index].text,
                    options: existingOptions.length > 0 ? existingOptions : [''],
                };
            }
            renderQuestions();
        });
    });

    // Удаление опции
    container.querySelectorAll('.remove-option-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const row = (e.target as HTMLElement).closest('.option-row') as HTMLElement | null;
            if (!row) return;
            const qi = parseInt(row.getAttribute('data-question-index') || '0');
            const oi = parseInt(row.getAttribute('data-option-index') || '0');
            if (!questions[qi]) return;

            const question = questions[qi];
            if (isChoiceQuestion(question)) {
                question.options.splice(oi, 1);
                renderQuestions();
            }
        });
    });

    // Добавление опции
    container.querySelectorAll('.add-option-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const qi = parseInt((e.target as HTMLElement).getAttribute('data-question-index') || '0');
            if (!questions[qi]) return;

            const question = questions[qi];
            if (!isChoiceQuestion(question)) return;

            if (question.options.length >= MAX_OPTIONS) {
                showToast({ message: `Нельзя добавить больше ${MAX_OPTIONS} вариантов`, type: 'error' });
                return;
            }

            question.options.push('');
            renderQuestions();
        });
    });

    // Удаление вопроса
    container.querySelectorAll('.remove-question-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const block = (e.target as HTMLElement).closest('.question-block') as HTMLElement | null;
            if (!block) return;
            const index = parseInt(block.dataset.index || '0');
            questions.splice(index, 1);
            renderQuestions();
        });
    });
}

function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) {
        showToast({ message: `Нельзя добавить больше ${MAX_QUESTIONS} вопросов`, type: 'error' });
        return;
    }

    questions.push({
        id: undefined,
        type: 'text',
        text: '',
    });
    renderQuestions();
}

async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!currentSurveyId) return;

    const titleInput = document.getElementById('survey-title') as HTMLTextAreaElement;
    const title = titleInput?.value.trim() || '';

    if (!title) {
        showToast({ message: 'Введите название опроса', type: 'error' });
        return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
        showToast({ message: `Название не может превышать ${MAX_TITLE_LENGTH} символов`, type: 'error' });
        return;
    }

    const filledQuestions = questions.filter(q => q.text.trim() !== '');

    if (filledQuestions.length === 0) {
        showToast({ message: 'Добавьте хотя бы один вопрос', type: 'error' });
        return;
    }

    const questionsData: Question[] = [];

    for (const [index, q] of filledQuestions.entries()) {
        if (q.text.length > MAX_QUESTION_TEXT_LENGTH) {
            showToast({ message: `Текст вопроса ${index + 1} слишком длинный`, type: 'error' });
            return;
        }

        if (isChoiceQuestion(q)) {
            const filledOptions = q.options
                .map(opt => opt.trim())
                .filter(opt => opt !== '');

            if (filledOptions.length === 0) {
                showToast({ message: `Вопрос "${q.text}" должен иметь хотя бы один вариант`, type: 'error' });
                return;
            }

            for (const opt of filledOptions) {
                if (opt.length > MAX_OPTION_LENGTH) {
                    showToast({ message: `Вариант "${opt}" слишком длинный`, type: 'error' });
                    return;
                }
            }

            questionsData.push({
                id: q.id,
                type: q.type,
                text: q.text,
                options: filledOptions,
            });
        } else {
            questionsData.push({
                id: q.id,
                type: 'text',
                text: q.text,
            });
        }
    }

    const result = await put<SurveyWithQuestions>(`/surveys/edit/${currentSurveyId}`, {
        title,
        questions: questionsData,
    });

    if (!result.success) {
        showToast({ message: result.error, type: 'error' });
        return;
    }

    showToast({ message: 'Опрос обновлён! 🎉', type: 'success' });
    navigateTo('/profile');
}

async function handleDelete() {
    if (!currentSurveyId) return;

    const confirmed = confirm('Вы уверены, что хотите удалить опрос? Это действие нельзя отменить.');
    if (!confirmed) return;

    const result = await del(`/surveys/${currentSurveyId}`);

    if (!result.success) {
        showToast({ message: result.error, type: 'error' });
        return;
    }

    showToast({ message: 'Опрос удалён', type: 'success' });
    navigateTo('/profile');
}