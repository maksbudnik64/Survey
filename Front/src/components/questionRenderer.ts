import type { Question, ChoiceQuestion } from "../types";

export abstract class QuestionRenderer {
    protected questions: Question[];

    constructor(questions: Question[]) {
        this.questions = questions;
    }

    render(): string {
        return this.questions.map((q, i) => this.renderQuestion(q, i)).join('');
    }

    protected renderQuestion(question: Question, index: number): string {
        return `
            <div class="question-block" data-index="${index}" data-question-id="${question.id}">
                ${this.renderHeader(question, index)}
                ${this.renderBody(question, index)}
                ${this.renderFooter(question, index)}
            </div>
        `;
    }

    protected renderHeader(question: Question, index: number): string {
        return `
            <div class="question-header">
                <span class="question-number">Вопрос ${index + 1}</span>
            </div>
        `;
    }

    protected abstract renderBody(question: Question, index: number): string;
    protected abstract renderFooter(question: Question, index: number): string;

    protected isChoiceQuestion(q: Question): q is ChoiceQuestion {
        return q.type === 'single_choice' || q.type === 'multiple_choice';
    }
}