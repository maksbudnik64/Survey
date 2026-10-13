import { put, del } from '../api/client';
import { renderHeader } from '../components/header';
import { showToast } from '../components/toast';
import { navigateTo } from '../utils/router';
import type { SurveyWithQuestions, Question } from '../types';
import { MAX_TITLE_LENGTH } from '../constants';
import { withSubmitLock } from '../utils/form';
import {
  addQuestion,
  attachEditorListeners,
  collectQuestionsFromForm,
  renderQuestionList,
} from './surveyEditor';

let questions: Question[] = [];
let currentSurveyId: number | null = null;

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

export async function initSurveyEditPage(survey: SurveyWithQuestions): Promise<void> {
  const surveyId = survey.id;
  currentSurveyId = surveyId;

  document
    .getElementById('stats-tab-btn')
    ?.addEventListener('click', () => navigateTo(`/survey/${surveyId}/stats`));

  document.getElementById('delete-survey-btn')?.addEventListener('click', handleDelete);

  const titleInput = document.querySelector<HTMLTextAreaElement>('#survey-title');
  const titleCounter = document.getElementById('title-counter');
  if (titleInput && titleCounter) {
    titleInput.value = survey.title;
    titleCounter.textContent = `${survey.title.length} / ${MAX_TITLE_LENGTH}`;
    titleInput.addEventListener('input', () => {
      titleCounter.textContent = `${titleInput.value.length} / ${MAX_TITLE_LENGTH}`;
    });
  }

  questions = survey.questions;
  renderQuestions();

  document
    .getElementById('add-question-btn')
    ?.addEventListener('click', () => addQuestion(questions, renderQuestions));

  document
    .querySelector<HTMLFormElement>('#edit-survey-form')
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
  if (!currentSurveyId) return;

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

    const result = await put<SurveyWithQuestions>(`/surveys/edit/${currentSurveyId}`, {
      title,
      questions: collected.data,
    });

    if (!result.success) {
      showToast({ message: result.error, type: 'error' });
      return;
    }

    showToast({ message: 'Опрос обновлён! 🎉', type: 'success' });
    navigateTo('/profile');
  });
}

async function handleDelete(): Promise<void> {
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