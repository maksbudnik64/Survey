import { get, post } from '../api/client';
import { renderHeader } from '../components/header';
import { showToast } from '../components/toast';
import { navigateTo } from '../utils/router';
import { SurveyTakerRenderer } from '../components/surveyTakerRenderer';
import type { SurveyWithQuestions } from '../types';
import { withSubmitLock } from '../utils/form';

export function renderSurveyTake(): string {
  return `
    ${renderHeader()}
    <main class="main-content">
      <h1 id="survey-title">Loading...</h1>
      <form id="survey-form">
        <div id="questions-container"></div>
        <button type="submit" class="primary" style="width: 100%; margin-top: 1rem;">
          Submit answers
        </button>
      </form>
    </main>
  `;
}

export async function initSurveyTakePage(survey: SurveyWithQuestions): Promise<void> {
  const surveyId = survey.id;

  const respondedResult = await get<boolean>(`/surveys/${surveyId}/responded`);
  if (respondedResult.success && respondedResult.data === true) {
    showToast({ message: 'You have already taken this survey', type: 'info' });
    navigateTo('/');
    return;
  }

  const titleEl = document.getElementById('survey-title');
  if (titleEl) titleEl.textContent = survey.title;

  const container = document.getElementById('questions-container');
  if (container) {
    const renderer = new SurveyTakerRenderer(survey.questions);
    container.innerHTML = renderer.render();
  }

  const form = document.querySelector<HTMLFormElement>('#survey-form');
  form?.addEventListener('submit', (e) => handleSubmit(e, survey));
}

async function handleSubmit(e: Event, survey: SurveyWithQuestions): Promise<void> {
  e.preventDefault();

  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;

  await withSubmitLock(form, async () => {
    const answers: Record<string, string | string[]> = {};

    for (const [index, q] of survey.questions.entries()) {
      if (q.id === undefined) continue;

      const label = `Question ${index + 1}`;

      if (q.type === 'text') {
        const input = document.querySelector<HTMLTextAreaElement>(
          `.answer-input[data-question-id="${q.id}"]`
        );
        const value = input?.value.trim() ?? '';

        if (!value) {
          showToast({ message: `${label}: please enter an answer`, type: 'error' });
          return;
        }
        answers[q.id] = value;
        continue;
      }

      if (q.type === 'single_choice') {
        const checked = document.querySelector<HTMLInputElement>(
          `input[name="question-${q.id}"]:checked`
        );

        if (!checked) {
          showToast({ message: `${label}: please select an option`, type: 'error' });
          return;
        }
        answers[q.id] = checked.value;
        continue;
      }

      const checked = document.querySelectorAll<HTMLInputElement>(
        `input[name="question-${q.id}"]:checked`
      );

      if (checked.length === 0) {
        showToast({ message: `${label}: please select at least one option`, type: 'error' });
        return;
      }
      answers[q.id] = Array.from(checked).map((c) => c.value);
    }

    const submitResult = await post<number>(`/surveys/${survey.id}/responses`, { answers });

    if (!submitResult.success) {
      showToast({ message: submitResult.error, type: 'error' });
      return;
    }

    showToast({ message: 'Thank you! Your answers have been submitted 🎉', type: 'success' });
    navigateTo('/');
  });
}