import { post } from '../api/client';
import { renderHeader } from '../components/header';
import { showToast } from '../components/toast';
import { navigateTo } from '../utils/router';
import type { Question } from '../types';
import { MAX_TITLE_LENGTH } from '../constants';
import { withSubmitLock } from '../utils/form';
import {
  addQuestion,
  attachEditorListeners,
  collectQuestionsFromForm,
  renderQuestionList,
} from './surveyEditor';

let questions: Question[] = [];

export function renderCreateSurvey(): string {
  return `
    ${renderHeader()}
    <main class="main-content">
      <h1>Создание опроса</h1>
      <form id="create-survey-form" class="create-survey-form">
        <div class="form-group">
          <label for="survey-title">Название опроса</label>
          <div class="input-with-counter">
            <textarea
              id="survey-title"
              placeholder="Введите название"
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
          Создать опрос
        </button>
      </form>
    </main>
  `;
}

export function initCreateSurveyPage(): void {
  questions = [];
  renderQuestions();

  const titleInput = document.querySelector<HTMLTextAreaElement>('#survey-title');
  const titleCounter = document.getElementById('title-counter');
  if (titleInput && titleCounter) {
    titleInput.addEventListener('input', () => {
      titleCounter.textContent = `${titleInput.value.length} / ${MAX_TITLE_LENGTH}`;
    });
  }

  document
    .getElementById('add-question-btn')
    ?.addEventListener('click', () => addQuestion(questions, renderQuestions));

  document
    .querySelector<HTMLFormElement>('#create-survey-form')
    ?.addEventListener('submit', handleSubmit);
}

function renderQuestions(): void {
  const container = document.getElementById('questions-container');
  if (!container) return;

  renderQuestionList(container, questions);
  attachEditorListeners(container, questions, renderQuestions);
}

async function handleSubmit(e: Event): Promise<void> {
  e.preventDefault();

  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;

  await withSubmitLock(form, async () => {
    const titleInput = document.querySelector<HTMLTextAreaElement>('#survey-title');
    const title = titleInput?.value.trim() ?? '';

    if (!title) {
      showToast({ message: 'Введите название опроса', type: 'error' });
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      showToast({ message: `Название не может превышать ${MAX_TITLE_LENGTH} символов`, type: 'error' });
      return;
    }

    const collected = collectQuestionsFromForm(questions);
    if (!collected.ok) {
      showToast({ message: collected.error, type: 'error' });
      return;
    }

    const result = await post<{ id: number }>('/surveys', {
      title,
      questions: collected.data,
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
    questions = [];
    navigateTo('/profile');
  });
}