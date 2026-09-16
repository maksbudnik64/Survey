import { selectUserById } from "../repositories/userRepository.ts"
import { selectMySurveys, selectSurveys, insertNewSurvey, selectSurveyById } from "../repositories/surveyRepository.ts";
import type { ApiResponse, PublicUser, Question, Survey } from "../types.ts";
import { errors, ok } from "../utils/helpers.ts";

export async function getMySurveys(id: number): Promise<ApiResponse<Survey[]>>{
 const result = await selectUserById(id);
 if (!result.success) {
        return result;
    }
 if (!result.data){
return errors.userNotFound();
};
const answer = await selectMySurveys(id)
    return answer;
}

export async function getSurveys(): Promise<ApiResponse<Survey[]>>{
    const result = await selectSurveys();
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