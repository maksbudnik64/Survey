import { QuestionRenderer } from "./questionRenderer";
import type { Question } from "../types";

export interface QuestionStats {
    questionId: number;
    total: number;
    options: { label: string; count: number; percentage: number }[];
}

export class SurveyStatsRenderer extends QuestionRenderer {
    private stats: QuestionStats[];
    private totalResponses: number;

    constructor(questions: Question[], stats: QuestionStats[], totalResponses: number) {
        super(questions);
        this.stats = stats;
        this.totalResponses = totalResponses;
    }

    protected renderBody(question: Question, index: number): string {
        return `
            <div class="stats-total">
                Всего ответов: <strong>${this.totalResponses}</strong>
            </div>
        `;
    }

    protected renderFooter(question: Question, index: number): string {
        const stats = this.stats.find(s => s.questionId === question.id);
        if (!stats) return '<p>Нет данных</p>';

        return `
            <div class="stats-list">
                ${stats.options.map(opt => `
                    <div class="stat-row">
                        <span class="stat-label">${opt.label}</span>
                        <div class="stat-bar">
                            <div class="stat-bar-fill" style="width: ${opt.percentage}%"></div>
                        </div>
                        <span class="stat-value">${opt.percentage}% (${opt.count})</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}