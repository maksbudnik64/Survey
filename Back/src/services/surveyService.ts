import { selectMySurveys, selectSurveys, insertNewSurvey, selectSurveyById, updateSurvey as updateSurveyRepo, selectSurveyQuestions } from "../repositories/surveyRepository.ts";
import type { ApiResponse, PublicUser, Question, Survey, SurveyWithQuestions } from "../types.ts";
import { errors, ok } from "../utils/helpers.ts";

export async function getMySurveys(id: number): Promise<ApiResponse<Survey[]>>{
const answer = await selectMySurveys(id)
    return answer;
}

export async function getSurveys(): Promise<ApiResponse<Survey[]>>{
    const result = await selectSurveys();
    return result;
}

export async function getSurveyById(id: number): Promise<ApiResponse<SurveyWithQuestions>>{
    const surveyResult = await selectSurveyById(id);
    if (!surveyResult.success){
        return surveyResult;
    }

    if (!surveyResult.data){
        return errors.surveyNotFound();
    }

    const result = await selectSurveyQuestions(id);
    if (!result.success){
        return result;
    }

    if (!result.data){
        return errors.internal('Questions not found')
    }

    return ok({...surveyResult.data, questions: result.data})
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

export async function updateSurvey( user: PublicUser, survey_id: number, title: string, questions: Question[]): Promise<ApiResponse<Survey>>{
    const surveyResult = await selectSurveyById(survey_id);
    if (!surveyResult.success){
        return surveyResult;
 }

    if (!surveyResult.data){
        return errors.surveyNotFound();
 }

    if (surveyResult.data.author_id !== user.id){
        return errors.forbidden();
 }

    const result = await updateSurveyRepo(survey_id, title, questions);
    if (!result.success){
        return result;
}
    
    if (!result.data){
        return errors.internal('Survey updated but not found');
    }

    return ok(result.data)
}