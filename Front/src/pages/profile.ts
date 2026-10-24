import { get } from '../api/client';
import { renderHeader } from '../components/header';
import { renderSurveyCard } from '../components/surveyCard';
import { showToast } from '../components/toast';
import { navigateTo } from '../utils/router';
import type { Survey } from '../types';

const CREATE_BUTTON = `
  <div class="create-survey-wrapper">
    <button id="create-survey-btn" class="primary">+ Create survey</button>
  </div>
`;

export async function renderProfile(): Promise<string> {
  const header = renderHeader();
  const result = await get<Survey[]>('/surveys/mySurveys');

  let content: string;
  if (!result.success) {
    showToast({
      message: result.error || 'Failed to load surveys',
      type: 'error',
    });
    content = '<p class="error">Could not load surveys</p>';
  } else if (!result.data || result.data.length === 0) {
    content = `
      <p class="empty">No surveys yet. Create your first survey!</p>
      ${CREATE_BUTTON}
    `;
  } else {
    const cards = result.data.map(renderSurveyCard).join('');
    content = `
      ${CREATE_BUTTON}
      <div class="grid">${cards}</div>
    `;
  }

  return `
    ${header}
    <main class="main-content">
      <h1>My surveys</h1>
      ${content}
    </main>
  `;
}

document.addEventListener('click', (e) => {
  if (!(e.target instanceof HTMLElement)) return;

  const btn = e.target.closest<HTMLButtonElement>('#create-survey-btn');
  if (btn) navigateTo('/survey/create');
});