import { QuestionRenderer } from './questionRenderer';
import type { Question } from '../types';
import { escapeHtml } from '../utils/html';

export interface QuestionStats {
  questionId: number;
  questionText: string;
  type: string;
  total: number;
  options: { label: string; count: number; percentage: number }[];
}

export class SurveyStatsRenderer extends QuestionRenderer {
  private readonly stats: QuestionStats[];
  private readonly totalResponses: number;

  constructor(questions: Question[], stats: QuestionStats[], totalResponses: number) {
    super(questions);
    this.stats = stats;
    this.totalResponses = totalResponses;
  }

  protected renderHeader(question: Question, index: number): string {
    return `
      <div class="question-header">
        <span class="question-number">Вопрос ${index + 1}</span>
      </div>
      <p class="question-text-display">${escapeHtml(question.text)}</p>
    `;
  }

  protected renderBody(_question: Question, _index: number): string {
    return `
      <div class="stats-total">
        Всего ответов: <strong>${this.totalResponses}</strong>
      </div>
    `;
  }

  protected renderFooter(question: Question, _index: number): string {
    const stats = this.stats.find((s) => s.questionId === question.id);
    if (!stats || stats.options.length === 0) {
      return '<p>Нет данных</p>';
    }

    const rows = stats.options
      .map(
        (opt) => `
        <div class="stat-row">
          <span class="stat-label" title="${escapeHtml(opt.label)}">${escapeHtml(opt.label)}</span>
          <div class="stat-bar">
            <div class="stat-bar-fill" style="width: ${opt.percentage}%"></div>
          </div>
          <span class="stat-value">${opt.percentage}% (${opt.count})</span>
        </div>
      `
      )
      .join('');

    return `
      <div class="stats-list">
        ${rows}
      </div>
    `;
  }
}