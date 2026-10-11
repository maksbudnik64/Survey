import {
  selectMySurveys,
  selectSurveys,
  insertNewSurvey,
  selectSurveyById,
  updateSurvey as updateSurveyRepo,
  selectSurveyQuestions,
  selectSurveyAnswers,
  deleteSurvey as deleteSurveyRepo,
  insertResponse,
  hasUserResponded,
} from '../repositories/surveyRepository.ts';
import type {
  Answer,
  ApiResponse,
  PublicUser,
  Question,
  Survey,
  SurveyWithQuestions,
} from '../types.ts';
import { errors, ok } from '../utils/helpers.ts';

export async function getMySurveys(userId: number): Promise<ApiResponse<Survey[]>> {
  return selectMySurveys(userId);
}

export async function getSurveys(): Promise<ApiResponse<Survey[]>> {
  return selectSurveys();
}

export async function getSurveyById(surveyId: number): Promise<ApiResponse<SurveyWithQuestions>> {
  const surveyResult = await selectSurveyById(surveyId);
  if (!surveyResult.success) return surveyResult;
  if (!surveyResult.data) return errors.surveyNotFound();

  const questionsResult = await selectSurveyQuestions(surveyId);
  if (!questionsResult.success) return questionsResult;
  if (!questionsResult.data) return errors.internal('Questions not found');

  return ok({ ...surveyResult.data, questions: questionsResult.data });
}

export async function getSurveyAnswers(
  user: PublicUser,
  surveyId: number
): Promise<ApiResponse<Answer[]>> {
  const surveyResult = await getOwnedSurveyOrError(user.id, surveyId);
  if (!surveyResult.success) return surveyResult;

  return selectSurveyAnswers(surveyId);
}

export async function createSurvey(
  user: PublicUser,
  title: string,
  questions: Question[]
): Promise<ApiResponse<Survey>> {
  const insertResult = await insertNewSurvey(user.id, title, questions);
  if (!insertResult.success) return insertResult;
  if (!insertResult.data) return errors.internal('Survey created but no ID');

  const surveyResult = await selectSurveyById(insertResult.data);
  if (!surveyResult.success) return surveyResult;
  if (!surveyResult.data) return errors.internal('Survey created but not found');

  return ok(surveyResult.data);
}

export async function submitResponse(
  userId: number,
  surveyId: number,
  answers: Record<string, string | string[]>
): Promise<ApiResponse<number>> {
  const surveyResult = await getSurveyOrError(surveyId);
  if (!surveyResult.success) return surveyResult;

  if (surveyResult.data!.author_id === userId) {
    return errors.forbidden('Author cannot respond to their own survey');
  }

  const hasResponded = await hasUserResponded(surveyId, userId);
  if (!hasResponded.success) return hasResponded;
  if (hasResponded.data) return errors.alreadyResponded();

  const questionsResult = await selectSurveyQuestions(surveyId);
  if (!questionsResult.success) return questionsResult;
  if (!questionsResult.data) return errors.internal('Questions not found');

  const validationError = validateAnswersAgainstQuestions(answers, questionsResult.data);
  if (validationError) return errors.validation(validationError);

  return insertResponse(surveyId, userId, answers);
}

export async function hasUserRespondedToSurvey(
  surveyId: number,
  userId: number
): Promise<ApiResponse<boolean>> {
  const surveyResult = await getSurveyOrError(surveyId);
  if (!surveyResult.success) return surveyResult;

  return hasUserResponded(surveyId, userId);
}

export async function updateSurvey(
  user: PublicUser,
  surveyId: number,
  title: string,
  questions: Question[]
): Promise<ApiResponse<Survey>> {
  const surveyResult = await getOwnedSurveyOrError(user.id, surveyId);
  if (!surveyResult.success) return surveyResult;

  const result = await updateSurveyRepo(surveyId, title, questions);
  if (!result.success) return result;
  if (!result.data) return errors.internal('Survey updated but not found');

  return ok(result.data);
}

export async function deleteSurvey(user: PublicUser, surveyId: number): Promise<ApiResponse<null>> {
  const surveyResult = await getOwnedSurveyOrError(user.id, surveyId);
  if (!surveyResult.success) return surveyResult;

  return deleteSurveyRepo(surveyId);
}

function validateAnswersAgainstQuestions(
  answers: Record<string, string | string[]>,
  questions: Question[]
): string | null {
  const questionMap = new Map<number, Question>(questions.map((q) => [q.id, q]));

  for (const key of Object.keys(answers)) {
    const questionId = parseInt(key, 10);
    if (Number.isNaN(questionId) || !questionMap.has(questionId)) {
      return `Unknown question ID: ${key}`;
    }
  }

  for (const question of questions) {
    if (!(question.id.toString() in answers)) {
      return `Missing answer for question ${question.id}`;
    }
  }

  for (const [key, value] of Object.entries(answers)) {
    const questionId = parseInt(key, 10);
    const question = questionMap.get(questionId);
    if (!question) continue;

    if (question.type === 'text') {
      if (typeof value !== 'string') {
        return `Question ${questionId}: expected string answer`;
      }
      if (value.trim().length === 0) {
        return `Question ${questionId}: answer cannot be empty`;
      }
      continue;
    }

    if (question.type === 'single_choice') {
      if (typeof value !== 'string') {
        return `Question ${questionId}: expected single choice`;
      }
      if (!question.options.includes(value)) {
        return `Question ${questionId}: invalid option "${value}"`;
      }
      continue;
    }

    if (question.type === 'multiple_choice') {
      if (!Array.isArray(value)) {
        return `Question ${questionId}: expected array`;
      }
      if (value.length === 0) {
        return `Question ${questionId}: at least one choice required`;
      }
      if (new Set(value).size !== value.length) {
        return `Question ${questionId}: duplicate choices`;
      }
      for (const choice of value) {
        if (!question.options.includes(choice)) {
          return `Question ${questionId}: invalid option "${choice}"`;
        }
      }
    }
  }

  return null;
}

async function getSurveyOrError(surveyId: number): Promise<ApiResponse<Survey>> {
  const surveyResult = await selectSurveyById(surveyId);
  if (!surveyResult.success) return surveyResult;
  if (!surveyResult.data) return errors.surveyNotFound();
  return surveyResult;
}

async function getOwnedSurveyOrError(
  userId: number,
  surveyId: number
): Promise<ApiResponse<Survey>> {
  const surveyResult = await getSurveyOrError(surveyId);
  if (!surveyResult.success) return surveyResult;
  if (surveyResult.data!.author_id !== userId) return errors.forbidden();
  return surveyResult;
}