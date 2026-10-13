import { showToast } from '../components/toast';
import { SurveyEditorRenderer } from '../components/surveyEditorRenderer';
import type { Question, ChoiceQuestion } from '../types';
import {
  MAX_QUESTION_TEXT_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_QUESTIONS,
  MAX_OPTIONS,
} from '../constants';

export function isChoiceQuestion(q: Question): q is ChoiceQuestion {
  return q.type === 'single_choice' || q.type === 'multiple_choice';
}

export function renderQuestionList(container: HTMLElement, questions: Question[]): void {
  const renderer = new SurveyEditorRenderer(questions);
  container.innerHTML = renderer.render();
}

export function attachEditorListeners(
  container: HTMLElement,
  questions: Question[],
  rerender: () => void
): void {
  container.querySelectorAll<HTMLTextAreaElement>('.question-text').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      const block = textarea.closest<HTMLElement>('.question-block');
      if (!block) return;

      const index = Number(block.dataset.index ?? 0);
      const question = questions[index];
      if (!question) return;

      question.text = textarea.value;

      const counter = block.querySelector('.char-counter');
      if (counter) {
        counter.textContent = `${textarea.value.length} / ${MAX_QUESTION_TEXT_LENGTH}`;
      }
    });
  });

  container.querySelectorAll<HTMLTextAreaElement>('.option-input').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      const row = textarea.closest<HTMLElement>('.option-row');
      if (!row) return;

      const qi = Number(row.dataset.questionIndex ?? 0);
      const oi = Number(row.dataset.optionIndex ?? 0);
      const question = questions[qi];
      if (!question || !isChoiceQuestion(question)) return;

      question.options[oi] = textarea.value;

      const counter = row.querySelector('.option-counter');
      if (counter) {
        counter.textContent = `${textarea.value.length} / ${MAX_OPTION_LENGTH}`;
      }
    });
  });

  container.querySelectorAll<HTMLSelectElement>('.question-type').forEach((select) => {
    select.addEventListener('change', () => {
      const block = select.closest<HTMLElement>('.question-block');
      if (!block) return;

      const index = Number(block.dataset.index ?? 0);
      const question = questions[index];
      if (!question) return;

      const newType = select.value;
      if (newType === 'text') {
        questions[index] = { id: question.id, type: 'text', text: question.text };
      } else if (newType === 'single_choice' || newType === 'multiple_choice') {
        const existingOptions = isChoiceQuestion(question) ? question.options : [];
        questions[index] = {
          id: question.id,
          type: newType,
          text: question.text,
          options: existingOptions.length > 0 ? existingOptions : [''],
        };
      }
      rerender();
    });
  });

  container.querySelectorAll<HTMLButtonElement>('.remove-option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest<HTMLElement>('.option-row');
      if (!row) return;

      const qi = Number(row.dataset.questionIndex ?? 0);
      const oi = Number(row.dataset.optionIndex ?? 0);
      const question = questions[qi];
      if (!question || !isChoiceQuestion(question)) return;

      question.options.splice(oi, 1);
      rerender();
    });
  });

  container.querySelectorAll<HTMLButtonElement>('.add-option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const qi = Number(btn.dataset.questionIndex ?? 0);
      const question = questions[qi];
      if (!question || !isChoiceQuestion(question)) return;

      if (question.options.length >= MAX_OPTIONS) {
        showToast({ message: `Нельзя добавить больше ${MAX_OPTIONS} вариантов`, type: 'error' });
        return;
      }

      question.options.push('');
      rerender();
    });
  });

  container.querySelectorAll<HTMLButtonElement>('.remove-question-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const block = btn.closest<HTMLElement>('.question-block');
      if (!block) return;

      const index = Number(block.dataset.index ?? 0);
      questions.splice(index, 1);
      rerender();
    });
  });
}

export function addQuestion(questions: Question[], rerender: () => void): void {
  if (questions.length >= MAX_QUESTIONS) {
    showToast({ message: `Нельзя добавить больше ${MAX_QUESTIONS} вопросов`, type: 'error' });
    return;
  }

  questions.push({ id: undefined, type: 'text', text: '' });
  rerender();
}

export function collectQuestionsFromForm(
  questions: Question[]
): { ok: true; data: Question[] } | { ok: false; error: string } {
  const filled = questions.filter((q) => q.text.trim() !== '');
  if (filled.length === 0) {
    return { ok: false, error: 'Добавьте хотя бы один вопрос' };
  }

  const data: Question[] = [];

  for (const [index, q] of filled.entries()) {
    if (q.text.length > MAX_QUESTION_TEXT_LENGTH) {
      return { ok: false, error: `Текст вопроса ${index + 1} слишком длинный` };
    }

    if (!isChoiceQuestion(q)) {
      data.push({ id: q.id, type: 'text', text: q.text });
      continue;
    }

    const options = q.options.map((o) => o.trim()).filter((o) => o !== '');
    if (options.length === 0) {
      return { ok: false, error: `Вопрос "${q.text}" должен иметь хотя бы один вариант` };
    }

    for (const opt of options) {
      if (opt.length > MAX_OPTION_LENGTH) {
        return { ok: false, error: `Вариант "${opt}" слишком длинный` };
      }
    }

    data.push({ id: q.id, type: q.type, text: q.text, options });
  }

  return { ok: true, data };
}