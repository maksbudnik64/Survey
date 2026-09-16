import { authenticateToken } from "../middleware/auth.ts";
import { Router } from "express";
import { getMySurveys, getSurveys, createSurvey } from "../services/surveyService.ts";
import { sendResponse, fail } from "../utils/helpers.ts";
import { validateSurvey } from "../validators/surveyValidator.ts";

const surveyRouter = Router();

surveyRouter.get('/mySurveys', authenticateToken, async (req, res) => {
   if (!req.user) {
    return sendResponse(res, fail('User not authenticated', 'INVALID_CREDENTIALS'))
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
    return sendResponse(res, fail('User not authenticated', 'INVALID_CREDENTIALS'))
}
    const result = await createSurvey(req.user, req.body.title, req.body.questions);
    return sendResponse(res, result);
})

export default surveyRouter;