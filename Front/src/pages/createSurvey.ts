// src/pages/createSurvey.ts
import { post } from "../api/client";
import { renderHeader } from "../components/header";
import { showToast } from "../components/toast";
import { navigateTo } from "../utils/router";
import type { Question, ChoiceQuestion } from "../types";
import {
    MAX_TITLE_LENGTH,
    MAX_QUESTION_TEXT_LENGTH,
    MAX_OPTION_LENGTH,
    MAX_QUESTIONS,
    MAX_OPTIONS,
} from "../constants";
import { validateTitle, validateQuestionText, validateOption } from "../utils/validators";

let questions: Question[] = [];

function isChoiceQuestion(q: Question): q is ChoiceQuestion {
    return q.type === 'single_choice' || q.type === 'multiple_choice';
}

export function renderCreateSurvey(): string {
    const header = renderHeader();

    return `
        ${header}
        <main class="main-content">
            <h1>Создание опроса</h1>
            <form id="create-survey-form" class="create-survey-form">
                <div class="form-group">
                    <label for="survey-title">Название опроса</label>
                    <div class="input-with-counter">
                        <input type="text" id="survey-title" placeholder="Введите название опроса" maxlength="${MAX_TITLE_LENGTH}" required>
                        <span class="char-counter" id="title-counter">0 / ${MAX_TITLE_LENGTH}</span>
                    </div>
                </div>

                <div class="form-group">
                    <label>Вопросы</label>
                    <div id="questions-container"></div>
                    <button type="button" id="add-question-btn" class="secondary">+ Добавить вопрос</button>
                </div>

                <button type="submit" class="primary" style="width: 100%; margin-top: 1rem;">Создать опрос</button>
            </form>
        </main>
    `;
}

function renderOption(option: string, questionIndex: number, optionIndex: number): string {
    return `
        <div class="option-row" data-question-index="${questionIndex}" data-option-index="${optionIndex}">
            <div class="input-with-icon">
                <input 
                    type="text" 
                    class="option-input" 
                    placeholder="Вариант ответа" 
                    value="${option}" 
                    maxlength="${MAX_OPTION_LENGTH}"
                >
                <span class="char-counter option-counter">${option.length} / ${MAX_OPTION_LENGTH}</span>
                <button type="button" class="remove-option-btn" title="Удалить">✕</button>
            </div>
        </div>
    `;
}

function renderQuestion(question: Question, index: number): string {
    const isChoice = isChoiceQuestion(question);

    // 👇 Если это choice и опций нет — добавляем одну пустую
    if (isChoice && question.options.length === 0) {
        question.options.push('');
    }

    const optionsHtml = isChoice
        ? question.options.map((opt, optIdx) => renderOption(opt, index, optIdx)).join('')
        : '';

    return `
        <div class="question-block" data-index="${index}">
            <div class="question-header">
                <span class="question-number">Вопрос ${index + 1}</span>
                <button type="button" class="remove-question-btn" data-index="${index}">✕</button>
            </div>
            <div class="form-group">
                <div class="input-with-counter">
                    <input type="text" class="question-text" placeholder="Текст вопроса" value="${question.text}" maxlength="${MAX_QUESTION_TEXT_LENGTH}" required>
                    <span class="char-counter question-counter">${question.text.length} / ${MAX_QUESTION_TEXT_LENGTH}</span>
                </div>
            </div>
            <div class="form-group">
                <select class="question-type">
                    <option value="text" ${question.type === 'text' ? 'selected' : ''}>Текстовый ответ</option>
                    <option value="single_choice" ${question.type === 'single_choice' ? 'selected' : ''}>Одиночный выбор</option>
                    <option value="multiple_choice" ${question.type === 'multiple_choice' ? 'selected' : ''}>Множественный выбор</option>
                </select>
            </div>
            <div class="form-group options-group" style="${isChoice ? '' : 'display: none;'}">
                <label>Варианты ответов</label>
                <div class="options-list">${optionsHtml}</div>
                <button type="button" class="add-option-btn secondary" data-question-index="${index}">+ Добавить вариант</button>
            </div>
        </div>
    `;
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    if (!container) return;

    // 1. Сохраняем информацию о фокусе
    const activeElement = document.activeElement;
    let focusInfo: {
        className: string;
        questionIndex: string | null;
        optionIndex: string | null;
        selectionStart: number | null;
        selectionEnd: number | null;
    } | null = null;

    if (activeElement instanceof HTMLInputElement && container.contains(activeElement)) {
        focusInfo = {
            className: activeElement.className,
            questionIndex: activeElement.closest('.question-block')?.getAttribute('data-index') || null,
            optionIndex: activeElement.closest('.option-row')?.getAttribute('data-option-index') || null,
            selectionStart: activeElement.selectionStart,
            selectionEnd: activeElement.selectionEnd,
        };
    }

    // 2. Перерисовываем
    container.innerHTML = questions.map((q, i) => renderQuestion(q, i)).join('');

    // 3. Вешаем обработчики
    attachListeners(container);

    // 4. Восстанавливаем фокус
    if (focusInfo) {
        let selector = `.${focusInfo.className.split(' ').join('.')}`;

        if (focusInfo.questionIndex !== null) {
            selector = `.question-block[data-index="${focusInfo.questionIndex}"] ${selector}`;
        }

        if (focusInfo.optionIndex !== null) {
            selector = `.option-row[data-option-index="${focusInfo.optionIndex}"] ${selector}`;
        }

        const element = container.querySelector(selector) as HTMLInputElement | null;
        if (element) {
            element.focus();
            if (
                focusInfo.selectionStart !== null &&
                focusInfo.selectionEnd !== null &&
                typeof element.setSelectionRange === 'function'
            ) {
                try {
                    element.setSelectionRange(focusInfo.selectionStart, focusInfo.selectionEnd);
                } catch {
                    // ignore
                }
            }
        }
    }
}

function attachListeners(container: HTMLElement) {
    // Смена типа вопроса
    container.querySelectorAll('.question-type').forEach((select) => {
        select.addEventListener('change', (e) => {
            const block = (e.target as HTMLElement).closest('.question-block') as HTMLElement | null;
            if (!block) return;
            const index = parseInt(block.dataset.index || '0');
            if (!questions[index]) return;
            const newType = (e.target as HTMLSelectElement).value;

            // 👇 Меняем тип с сохранением текста
            if (newType === 'text') {
                questions[index] = {
                    type: 'text',
                    text: questions[index].text,
                };
            } else if (newType === 'single_choice' || newType === 'multiple_choice') {
                // 👇 Если уже был ChoiceQuestion — сохраняем опции
                const existingOptions = isChoiceQuestion(questions[index])
                    ? questions[index].options
                    : [];
                questions[index] = {
                    type: newType,
                    text: questions[index].text,
                    options: existingOptions.length > 0 ? existingOptions : [''],
                };
            }
            renderQuestions();
        });
    });

    // Ввод текста вопроса
    container.querySelectorAll('.question-text').forEach((input) => {
        input.addEventListener('input', (e) => {
            const block = (e.target as HTMLElement).closest('.question-block') as HTMLElement | null;
            if (!block) return;
            const index = parseInt(block.dataset.index || '0');
            if (!questions[index]) return;
            const value = (e.target as HTMLInputElement).value;
            questions[index].text = value;

            const counter = block.querySelector('.question-counter');
            if (counter) counter.textContent = `${value.length} / ${MAX_QUESTION_TEXT_LENGTH}`;
        });
    });

    // Ввод опции
    container.querySelectorAll('.option-input').forEach((input) => {
        input.addEventListener('input', (e) => {
            const row = (e.target as HTMLElement).closest('.option-row') as HTMLElement | null;
            if (!row) return;
            const qi = parseInt(row.getAttribute('data-question-index') || '0');
            const oi = parseInt(row.getAttribute('data-option-index') || '0');
            if (!questions[qi]) return;

            const question = questions[qi];
            // 👇 Проверяем через type guard
            if (isChoiceQuestion(question)) {
                question.options[oi] = (e.target as HTMLInputElement).value;
            }

            const counter = row.querySelector('.option-counter');
            if (counter) {
                counter.textContent = `${(e.target as HTMLInputElement).value.length} / ${MAX_OPTION_LENGTH}`;
            }
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
            // 👇 Проверяем через type guard
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
            // 👇 Проверяем через type guard
            if (!isChoiceQuestion(question)) return;

            if (question.options.length >= MAX_OPTIONS) {
                showToast({
                    message: `Нельзя добавить больше ${MAX_OPTIONS} вариантов`,
                    type: 'error',
                });
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
        showToast({
            message: `Нельзя добавить больше ${MAX_QUESTIONS} вопросов`,
            type: 'error',
        });
        return;
    }
    questions.push({ text: '', type: 'text' });
    renderQuestions();
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

    const titleError = validateTitle(title);
    if (titleError) {
        showToast({ message: titleError, type: 'error' });
        return;
    }

    const filledQuestions = questions.filter(q => q.text.trim() !== '');

    if (filledQuestions.length === 0) {
        showToast({ message: 'Добавьте хотя бы один вопрос с текстом', type: 'error' });
        return;
    }

    const questionsData: Question[] = [];

    for (const [index, q] of filledQuestions.entries()) {
        const textError = validateQuestionText(q.text);
        if (textError) {
            showToast({ message: `Вопрос ${index + 1}: ${textError}`, type: 'error' });
            return;
        }

        if (isChoiceQuestion(q)) {
            const filledOptions = q.options
                .map(opt => opt.trim())
                .filter(opt => opt !== '');

            if (filledOptions.length === 0) {
                showToast({ message: `Вопрос "${q.text}" должен иметь хотя бы один вариант ответа`, type: 'error' });
                return;
            }

            for (const [oi, opt] of filledOptions.entries()) {
                const optError = validateOption(opt);
                if (optError) {
                    showToast({ message: `Вопрос ${index + 1}, вариант ${oi + 1}: ${optError}`, type: 'error' });
                    return;
                }
            }

            questionsData.push({
                type: q.type,
                text: q.text,
                options: filledOptions,
            });
        } else {
            questionsData.push({
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
    navigateTo(`/survey/${result.data.id}/edit`);
});