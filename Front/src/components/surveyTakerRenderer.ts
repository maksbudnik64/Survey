import { QuestionRenderer } from "./questionRenderer";
import type { Question } from "../types";
import { MAX_TEXT_ANSWER_LENGTH } from "../constants";

export class SurveyTakerRenderer extends QuestionRenderer {
    protected renderBody(question: Question, index: number): string {
        const questionText = `<p class="question-text-display">${question.text}</p>`;

        if (question.type === 'text') {
            return `
                ${questionText}
                <div class="form-group">
                    <textarea 
                        class="answer-input" 
                        data-question-id="${question.id}"
                        placeholder="Ваш ответ"
                        maxlength="${MAX_TEXT_ANSWER_LENGTH}"
                        rows="3"
                    ></textarea>
                </div>
            `;
        }

        if (this.isChoiceQuestion(question)) {
            const inputType = question.type === 'single_choice' ? 'radio' : 'checkbox';
            const name = `question-${question.id}`;

            return `
                ${questionText}
                <div class="form-group options-list">
                    ${question.options.map((opt) => `
                        <label class="option-label">
                            <input 
                                type="${inputType}" 
                                name="${name}" 
                                value="${opt}"
                                data-question-id="${question.id}"
                            >
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        }

        return '';
    }

    protected renderFooter(question: Question, index: number): string {
        return '';
    }
}