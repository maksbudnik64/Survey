import { selectUserById } from "../repositories/userRepository.ts"
import { selectMySurveys } from "../repositories/surveyRepository.ts";
import type { ApiResponse, Survey } from "../types.ts";

export async function getMySurveys(id: number): Promise<ApiResponse<Survey[]>>{
 const result = await selectUserById(id);
 if (!result.success) {
        return { success: false, error: result.error };
    }
 if (!result.data){
return {success: false, error: "User with this id doesn't exist"};
};
const answer = await selectMySurveys(id)
    return answer;
}