import { get } from '../api/client';
import { renderHeader } from '../components/header';
import { renderSurveyCard } from '../components/surveyCard';
import { showToast } from '../components/toast';
import type { Survey } from '../types';

export async function renderMain(): Promise<string> {
  const header = renderHeader();
  const result = await get<Survey[]>('/surveys');

  let content: string;
  if (!result.success) {
    showToast({
      message: result.error || 'Failed to load surveys',
      type: 'error',
    });
    content = '<p class="error">Could not load surveys</p>';
  } else if (!result.data || result.data.length === 0) {
    content = '<p class="empty">No surveys yet. Be the first!</p>';
  } else {
    const cards = result.data.map(renderSurveyCard).join('');
    content = `<div class="grid">${cards}</div>`;
  }

  return `
    ${header}
    <main class="main-content">
      <h1>All surveys</h1>
      ${content}
    </main>
  `;
}