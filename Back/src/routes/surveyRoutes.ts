import { authenticateToken } from "../middleware/auth.ts";
import { Router } from "express";
import { getMySurveys, getSurveys, createSurvey, updateSurvey } from "../services/surveyService.ts";
import { sendResponse, fail } from "../utils/helpers.ts";
import { validateSurvey } from "../validators/surveyValidator.ts";

const surveyRouter = Router();

surveyRouter.get('/mySurveys', authenticateToken, async (req, res) => {
   if (!req.user) {
    return sendResponse(res, fail('User not authenticated', 'UNAUTHORIZED'))
}
   const result = await getMySurveys(req.user.id);
   return sendResponse(res, result);
})

surveyRouter.get('/', async (req, res) =>{
    const result = await getSurveys();
    return sendResponse(res, result);
})

surveyRouter.post('/', authenticateToken, validateSurvey, async (req, res) =>{
    if (!req.user) {
    return sendResponse(res, fail('User not authenticated', 'UNAUTHORIZED'));
}
    const result = await createSurvey(req.user, req.body.title, req.body.questions);
    return sendResponse(res, result);
})

surveyRouter.put('/edit/:id', authenticateToken, validateSurvey, async (req, res) => {
    if (!req.user) {
    return sendResponse(res, fail('User not authenticated', 'UNAUTHORIZED'));
}
    if (!req.params.id){
        return sendResponse(res, fail('Survey id is required', 'VALIDATION_ERROR'))
    }
    const result = await updateSurvey( req.user, +req.params.id, req.body.title, req.body.questions);
    return sendResponse(res, result);
})

export default surveyRouter;