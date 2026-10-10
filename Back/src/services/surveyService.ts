import { selectMySurveys, selectSurveys, insertNewSurvey, selectSurveyById, updateSurvey as updateSurveyRepo, selectSurveyQuestions, selectSurveyAnswers, deleteSurvey as deleteSurveyRepo, insertResponse, hasUserResponded } from "../repositories/surveyRepository.ts";
import type { Answer, ApiResponse, PublicUser, Question, ChoiceQuestion, Survey, SurveyWithQuestions } from "../types.ts";
import { errors, ok } from "../utils/helpers.ts";

export async function getMySurveys(userId: number): Promise<ApiResponse<Survey[]>>{
const answer = await selectMySurveys(userId)
    return answer;
}

export async function getSurveys(): Promise<ApiResponse<Survey[]>>{
    const result = await selectSurveys();
    return result;
}

export async function getSurveyById(surveyId: number): Promise<ApiResponse<SurveyWithQuestions>>{
    const surveyResult = await selectSurveyById(surveyId);
    if (!surveyResult.success){
        return surveyResult;
    }

    if (!surveyResult.data){
        return errors.surveyNotFound();
    }

    const result = await selectSurveyQuestions(surveyId);
    if (!result.success){
        return result;
    }

    if (!result.data){
        return errors.internal('Questions not found')
    }

    return ok({...surveyResult.data, questions: result.data})
}

export async function getSurveyAnswers(user: PublicUser, surveyId: number): Promise<ApiResponse<Answer[]>>{
    const surveyResult = await selectSurveyById(surveyId);
    if (!surveyResult.success){
        return surveyResult;
 }

    if (!surveyResult.data){
        return errors.surveyNotFound();
 }

    if (surveyResult.data.author_id !== user.id){
        return errors.forbidden();
 }

    const result = await selectSurveyAnswers(surveyId);
    return result;
}

export async function createSurvey(user: PublicUser, title: string, questions: Question[]): Promise<ApiResponse<Survey>>{
    const insertResult = await insertNewSurvey(user.id, title, questions);
    if (!insertResult.success) return insertResult;
    if (!insertResult.data) {
        return errors.internal("Survey created but no ID");
    }

    const surveyResult = await selectSurveyById(insertResult.data);
    if (!surveyResult.success) return surveyResult;
    if (!surveyResult.data) {
        return errors.internal("Survey created but not found");
    }

    return ok(surveyResult.data);
}

export async function submitResponse(
    userId: number,
    surveyId: number,
    answers: Record<string, string | string[]>
): Promise<ApiResponse<number>> {
    // 1. Проверяем, что опрос существует
    const surveyResult = await selectSurveyById(surveyId);
    if (!surveyResult.success) return surveyResult;
    if (!surveyResult.data) return errors.surveyNotFound();

    // 2. Проверяем, не проходил ли уже
    const hasResponded = await hasUserResponded(surveyId, userId);
    if (!hasResponded.success) return hasResponded;
    if (hasResponded.data) {
        return errors.alreadyResponded();
    }

    // 3. Загружаем вопросы
    const questionsResult = await selectSurveyQuestions(surveyId);
    if (!questionsResult.success) return questionsResult;
    if (!questionsResult.data) return errors.internal('Questions not found');

    const validationError = validateAnswersAgainstQuestions(answers, questionsResult.data);
    if (validationError) {
        return errors.validation(validationError);
    }

    return await insertResponse(surveyId, userId, answers);
}

function validateAnswersAgainstQuestions(
    answers: Record<string, string | string[]>,
    questions: Question[]
): string | null {
    const questionMap = new Map<number, Question>();
    for (const q of questions) {
        if (q.id !== undefined) {
            questionMap.set(q.id, q);
        }
    }

    for (const key of Object.keys(answers)) {
        const questionId = parseInt(key);
        if (!questionMap.has(questionId)) {
            return `Unknown question ID: ${key}`;
        }
    }

    for (const q of questions) {
        if (q.id === undefined) continue;
        if (!(q.id.toString() in answers)) {
            return `Missing answer for question ${q.id}`;
        }
    }

    for (const [key, value] of Object.entries(answers)) {
        const questionId = parseInt(key);
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

        const choiceQuestion = question as ChoiceQuestion;

        if (question.type === 'single_choice') {
            if (typeof value !== 'string') {
                return `Question ${questionId}: expected single choice`;
            }
            if (!choiceQuestion.options.includes(value)) {
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
            const uniqueValues = new Set(value);
            if (uniqueValues.size !== value.length) {
                return `Question ${questionId}: duplicate choices`;
            }
            for (const v of value) {
                if (!choiceOptionsIncludes(choiceQuestion, v)) {
                    return `Question ${questionId}: invalid option "${v}"`;
                }
            }
        }
    }

    return null;
}

function choiceOptionsIncludes(q: ChoiceQuestion, value: string): boolean {
    return q.options.includes(value);
}

export async function updateSurvey( user: PublicUser, surveyId: number, title: string, questions: Question[]): Promise<ApiResponse<Survey>>{
    const surveyResult = await selectSurveyById(surveyId);
    if (!surveyResult.success){
        return surveyResult;
 }

    if (!surveyResult.data){
        return errors.surveyNotFound();
 }

    if (surveyResult.data.author_id !== user.id){
        return errors.forbidden();
 }

    const result = await updateSurveyRepo(surveyId, title, questions);
    if (!result.success){
        return result;
}
    
    if (!result.data){
        return errors.internal('Survey updated but not found');
    }

    return ok(result.data)
}

export async function deleteSurvey(user: PublicUser, surveyId: number): Promise<ApiResponse<null>>{
     const surveyResult = await selectSurveyById(surveyId);
    if (!surveyResult.success){
        return surveyResult;
 }

    if (!surveyResult.data){
        return errors.surveyNotFound();
 }

    if (surveyResult.data.author_id !== user.id){
        return errors.forbidden();
 }
    
    const result = await deleteSurveyRepo(surveyId);
    return result;
}