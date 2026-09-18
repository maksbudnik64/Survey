import { QuestionRenderer } from "./questionRenderer";
import type { Question } from "../types";

const MAX_QUESTION_TEXT_LENGTH = 500;
const MAX_OPTION_LENGTH = 255;

export class SurveyEditorRenderer extends QuestionRenderer {
    protected renderHeader(question: Question, index: number): string {
        return `
            <div class="question-header">
                <span class="question-number">Вопрос ${index + 1}</span>
                <button type="button" class="remove-question-btn" data-index="${index}">✕</button>
            </div>
        `;
    }

    protected renderBody(question: Question, index: number): string {
        return `
            <div class="form-group">
                <div class="input-with-counter">
                    <input 
                        type="text" 
                        class="question-text" 
                        data-index="${index}"
                        placeholder="Текст вопроса" 
                        value="${question.text}" 
                        maxlength="${MAX_QUESTION_TEXT_LENGTH}"
                    >
                    <span class="char-counter">${question.text.length} / ${MAX_QUESTION_TEXT_LENGTH}</span>
                </div>
            </div>
            <div class="form-group">
                <select class="question-type" data-index="${index}">
                    <option value="text" ${question.type === 'text' ? 'selected' : ''}>Текстовый ответ</option>
                    <option value="single_choice" ${question.type === 'single_choice' ? 'selected' : ''}>Одиночный выбор</option>
                    <option value="multiple_choice" ${question.type === 'multiple_choice' ? 'selected' : ''}>Множественный выбор</option>
                </select>
            </div>
        `;
    }

    protected renderFooter(question: Question, index: number): string {
        if (!this.isChoiceQuestion(question)) return '';

        return `
            <div class="form-group options-group">
                <label>Варианты ответов</label>
                <div class="options-list">
                    ${question.options.map((opt, oi) => `
                        <div class="option-row" data-question-index="${index}" data-option-index="${oi}">
                            <div class="input-with-icon">
                                <input 
                                    type="text" 
                                    class="option-input" 
                                    value="${opt}" 
                                    maxlength="${MAX_OPTION_LENGTH}"
                                >
                                <span class="char-counter option-counter">${opt.length} / ${MAX_OPTION_LENGTH}</span>
                                <button type="button" class="remove-option-btn">✕</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="add-option-btn secondary" data-question-index="${index}">
                    + Добавить вариант
                </button>
            </div>
        `;
    }
}