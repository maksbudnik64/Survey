import { post } from "../api/client";
import { renderHeader } from "../components/header";
import { showToast } from "../components/toast";
import { navigateTo } from "../utils/router";
import type { Question, ChoiceQuestion } from "../types";
import { SurveyEditorRenderer } from "../components/surveyEditorRenderer";

let questions: Question[] = [];

const MAX_TITLE_LENGTH = 255;
const MAX_QUESTION_TEXT_LENGTH = 500;
const MAX_OPTION_LENGTH = 255;
const MAX_QUESTIONS = 50;
const MAX_OPTIONS = 20;

function isChoiceQuestion(q: Question): q is ChoiceQuestion {
    return q.type === 'single_choice' || q.type === 'multiple_choice';
}

export function renderCreateSurvey(): string {
    return `
        ${renderHeader()}
        <main class="main-content">
            <h1>Создание опроса</h1>
            <form id="create-survey-form" class="create-survey-form">
                <div class="form-group">
                    <label for="survey-title">Название опроса</label>
                    <div class="input-with-counter">
                        <input 
                            type="text" 
                            id="survey-title" 
                            placeholder="Введите название" 
                            maxlength="${MAX_TITLE_LENGTH}" 
                            required
                        >
                        <span class="char-counter" id="title-counter">0 / ${MAX_TITLE_LENGTH}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Вопросы</label>
                    <div id="questions-container"></div>
                    <button type="button" id="add-question-btn" class="secondary">+ Добавить вопрос</button>
                </div>
                <button type="submit" class="primary" style="width: 100%; margin-top: 1rem;">
                    Создать опрос
                </button>
            </form>
        </main>
    `;
}

export function initCreateSurveyPage() {
    questions = [];
    renderQuestions();

    const titleInput = document.getElementById('survey-title') as HTMLInputElement;
    const titleCounter = document.getElementById('title-counter');
    if (titleInput && titleCounter) {
        titleInput.addEventListener('input', () => {
            titleCounter.textContent = `${titleInput.value.length} / ${MAX_TITLE_LENGTH}`;
        });
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

    container.querySelectorAll('.question-text').forEach((input) => {
        input.addEventListener('input', (e) => {
            const block = (e.target as HTMLElement).closest('.question-block') as HTMLElement | null;
            if (!block) return;
            const index = parseInt(block.dataset.index || '0');
            if (!questions[index]) return;
            const value = (e.target as HTMLInputElement).value;
            questions[index].text = value;

            const counter = block.querySelector('.char-counter');
            if (counter) counter.textContent = `${value.length} / ${MAX_QUESTION_TEXT_LENGTH}`;
        });
    });

    container.querySelectorAll('.option-input').forEach((input) => {
        input.addEventListener('input', (e) => {
            const row = (e.target as HTMLElement).closest('.option-row') as HTMLElement | null;
            if (!row) return;
            const qi = parseInt(row.getAttribute('data-question-index') || '0');
            const oi = parseInt(row.getAttribute('data-option-index') || '0');
            if (!questions[qi]) return;

            const question = questions[qi];
            if (isChoiceQuestion(question)) {
                question.options[oi] = (e.target as HTMLInputElement).value;
            }

            const counter = row.querySelector('.option-counter');
            if (counter) {
                counter.textContent = `${(e.target as HTMLInputElement).value.length} / ${MAX_OPTION_LENGTH}`;
            }
        });
    });

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

document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'add-question-btn') {
        addQuestion();
    }
});

document.addEventListener('submit', async (e) => {
    const form = (e.target as HTMLElement).closest('#create-survey-form');
    if (!form) return;
    e.preventDefault();

    const titleInput = document.getElementById('survey-title') as HTMLInputElement;
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

    const result = await post<{ id: number }>('/surveys', {
        title,
        questions: questionsData,
    });

    if (!result.success) {
        showToast({ message: result.error, type: 'error' });
        return;
    }

    if (!result.data) {
        showToast({ message: 'Опрос создан, но не удалось получить ID', type: 'error' });
        return;
    }

    showToast({ message: 'Опрос создан! 🎉', type: 'success' });
    navigateTo('/profile');
});