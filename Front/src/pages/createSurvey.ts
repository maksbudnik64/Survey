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
      <h1>Create survey</h1>
      <form id="create-survey-form" class="create-survey-form">
        <div class="form-group">
          <label for="survey-title">Survey title</label>
          <div class="input-with-counter">
            <textarea
              id="survey-title"
              placeholder="Enter a title"
              maxlength="${MAX_TITLE_LENGTH}"
              rows="1"
              required
            ></textarea>
            <span class="char-counter" id="title-counter">0 / ${MAX_TITLE_LENGTH}</span>
          </div>
        </div>
        <div class="form-group">
          <label>Questions</label>
          <div id="questions-container"></div>
          <button type="button" id="add-question-btn" class="secondary">+ Add question</button>
        </div>
        <button type="submit" class="primary" style="width: 100%; margin-top: 1rem;">
          Create survey
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
      showToast({ message: 'Please enter a survey title', type: 'error' });
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      showToast({ message: `Title cannot exceed ${MAX_TITLE_LENGTH} characters`, type: 'error' });
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
      showToast({ message: 'Survey created, but failed to get its ID', type: 'error' });
      return;
    }

    showToast({ message: 'Survey created! 🎉', type: 'success' });
    questions = [];
    navigateTo('/profile');
  });
}