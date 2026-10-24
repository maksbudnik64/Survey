import { QuestionRenderer } from './questionRenderer';
import type { Question } from '../types';
import { MAX_TEXT_ANSWER_LENGTH } from '../constants';
import { escapeHtml } from '../utils/html';

export class SurveyTakerRenderer extends QuestionRenderer {
  protected renderBody(question: Question, _index: number): string {
    const questionText = `<p class="question-text-display">${escapeHtml(question.text)}</p>`;

    if (question.type === 'text') {
      const idAttr = question.id !== undefined ? ` data-question-id="${question.id}"` : '';

      return `
        ${questionText}
        <div class="form-group">
          <textarea
            class="answer-input"${idAttr}
            placeholder="Your answer"
            maxlength="${MAX_TEXT_ANSWER_LENGTH}"
            rows="3"
          ></textarea>
        </div>
      `;
    }

    if (this.isChoiceQuestion(question)) {
      const inputType = question.type === 'single_choice' ? 'radio' : 'checkbox';
      const name = `question-${question.id}`;
      const idAttr = question.id !== undefined ? ` data-question-id="${question.id}"` : '';

      const options = question.options
        .map(
          (opt) => `
          <label class="option-label">
            <input
              type="${inputType}"
              name="${name}"
              value="${escapeHtml(opt)}"${idAttr}
            >
            <span>${escapeHtml(opt)}</span>
          </label>
        `
        )
        .join('');

      return `
        ${questionText}
        <div class="form-group options-list">
          ${options}
        </div>
      `;
    }

    return '';
  }

  protected renderFooter(_question: Question, _index: number): string {
    return '';
  }
}