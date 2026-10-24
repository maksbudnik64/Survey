import { QuestionRenderer } from './questionRenderer';
import type { Question } from '../types';
import { MAX_QUESTION_TEXT_LENGTH, MAX_OPTION_LENGTH } from '../constants';
import { escapeHtml } from '../utils/html';

export class SurveyEditorRenderer extends QuestionRenderer {
  protected renderHeader(question: Question, index: number): string {
    return `
      <div class="question-header">
        <span class="question-number">Question ${index + 1}</span>
        <button type="button" class="remove-question-btn" data-index="${index}">✕</button>
      </div>
    `;
  }

  protected renderBody(question: Question, index: number): string {
    const text = escapeHtml(question.text);

    return `
      <div class="form-group">
        <div class="input-with-counter">
          <textarea
            class="question-text"
            data-index="${index}"
            placeholder="Question text"
            maxlength="${MAX_QUESTION_TEXT_LENGTH}"
            rows="2"
          >${text}</textarea>
          <span class="char-counter">${question.text.length} / ${MAX_QUESTION_TEXT_LENGTH}</span>
        </div>
      </div>
      <div class="form-group">
        <select class="question-type" data-index="${index}">
          <option value="text" ${question.type === 'text' ? 'selected' : ''}>Text answer</option>
          <option value="single_choice" ${question.type === 'single_choice' ? 'selected' : ''}>Single choice</option>
          <option value="multiple_choice" ${question.type === 'multiple_choice' ? 'selected' : ''}>Multiple choice</option>
        </select>
      </div>
    `;
  }

  protected renderFooter(question: Question, index: number): string {
    if (!this.isChoiceQuestion(question)) return '';

    const options = question.options
      .map((opt, oi) => this.renderOption(opt, index, oi))
      .join('');

    return `
      <div class="form-group options-group">
        <label>Answer options</label>
        <div class="options-list">
          ${options}
        </div>
        <button type="button" class="add-option-btn secondary" data-question-index="${index}">
          + Add option
        </button>
      </div>
    `;
  }

  private renderOption(option: string, questionIndex: number, optionIndex: number): string {
    const value = escapeHtml(option);

    return `
      <div class="option-row" data-question-index="${questionIndex}" data-option-index="${optionIndex}">
        <div class="input-with-icon">
          <textarea
            class="option-input"
            maxlength="${MAX_OPTION_LENGTH}"
            rows="1"
          >${value}</textarea>
          <span class="char-counter option-counter">${option.length} / ${MAX_OPTION_LENGTH}</span>
          <button type="button" class="remove-option-btn">✕</button>
        </div>
      </div>
    `;
  }
}