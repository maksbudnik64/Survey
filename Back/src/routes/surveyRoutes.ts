import { authenticateToken } from "../middleware/auth.ts";
import { Router } from "express";
import { getMySurveys, getSurveys, createSurvey, updateSurvey, getSurveyById, getSurveyAnswers, deleteSurvey, submitResponse} from "../services/surveyService.ts";
import { sendResponse, fail } from "../utils/helpers.ts";
import { validateSurvey } from "../validators/surveyValidator.ts";

const surveyRouter = Router();

function parseId(value: string | string[] | undefined): number | null {
    if (!value || typeof value !== 'string') return null;
    const id = parseInt(value);
    return isNaN(id) ? null : id;
}

surveyRouter.get('/mySurveys', authenticateToken, async (req, res) => {
   if (!req.user) {
    return sendResponse(res, fail('User not authenticated', 'UNAUTHORIZED'));
}
   const result = await getMySurveys(req.user.id);
   return sendResponse(res, result);
})

surveyRouter.get('/responses/:id', authenticateToken, async (req, res) => {
    if (!req.user) {
    return sendResponse(res, fail('User not authenticated', 'UNAUTHORIZED'));
}

    const surveyId = parseId(req.params.id);
    if (surveyId === null) {
        return sendResponse(res, fail('Invalid survey ID', 'VALIDATION_ERROR'));
    }


    const result = await getSurveyAnswers(req.user, surveyId);
    return sendResponse(res, result);
})

surveyRouter.get('/', async (req, res) =>{
    const result = await getSurveys();
    return sendResponse(res, result);
})

surveyRouter.get('/:id', async (req, res) => {
    const surveyId = parseId(req.params.id);
    if (surveyId === null) {
        return sendResponse(res, fail('Invalid survey ID', 'VALIDATION_ERROR'));
    }
console.log('ghbyzmnj');
    const result = await getSurveyById(surveyId);
    return sendResponse(res, result);
})

surveyRouter.post('/:id/responses', authenticateToken, async (req, res) => {
    if (!req.user) {
    return sendResponse(res, fail('User not authenticated', 'UNAUTHORIZED'));
}

    const surveyId = parseId(req.params.id);
    if (surveyId === null) {
        return sendResponse(res, fail('Invalid survey ID', 'VALIDATION_ERROR'));
    }

    const result = await submitResponse(req.user.id, surveyId, req.body.answers);
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
    const surveyId = parseId(req.params.id);
    if (surveyId === null) {
        return sendResponse(res, fail('Invalid survey ID', 'VALIDATION_ERROR'));
    }
    
    const result = await updateSurvey( req.user, surveyId, req.body.title, req.body.questions);
    return sendResponse(res, result);
})

surveyRouter.delete('/:id', authenticateToken, async (req, res) => {
    if (!req.user) {
    return sendResponse(res, fail('User not authenticated', 'UNAUTHORIZED'));
}
    const surveyId = parseId(req.params.id);
    if (surveyId === null) {
        return sendResponse(res, fail('Invalid survey ID', 'VALIDATION_ERROR'));
    }

    const result = await deleteSurvey(req.user, surveyId);
    return sendResponse(res, result);
})

export default surveyRouter;