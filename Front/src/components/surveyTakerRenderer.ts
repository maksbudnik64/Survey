import { QuestionRenderer } from "./questionRenderer";
import type { Question } from "../types";

export class SurveyTakerRenderer extends QuestionRenderer {
    protected renderBody(question: Question, index: number): string {
        if (question.type === 'text') {
            return `
                <div class="form-group">
                    <input 
                        type="text" 
                        class="answer-input" 
                        data-question-id="${question.id}"
                        placeholder="Ваш ответ"
                    >
                </div>
            `;
        }

        if (this.isChoiceQuestion(question)) {
            const inputType = question.type === 'single_choice' ? 'radio' : 'checkbox';
            const name = `question-${question.id}`;

            return `
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