import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.ts';
import {
  getMySurveys,
  getSurveys,
  createSurvey,
  updateSurvey,
  getSurveyById,
  getSurveyAnswers,
  deleteSurvey,
  submitResponse,
  hasUserRespondedToSurvey,
} from '../services/surveyService.ts';
import { errors, sendResponse } from '../utils/helpers.ts';
import type { PublicUser } from '../types.ts';
import { validateSurvey } from '../validators/surveyValidator.ts';
import { validateAnswers } from '../validators/answersValidator.ts';

const surveyRouter = Router();

function requireUser(req: Request, res: Response): PublicUser | null {
  if (!req.user) {
    sendResponse(res, errors.unauthorized('User not authenticated'));
    return null;
  }
  return req.user;
}

function requireSurveyId(req: Request, res: Response): number | null {
  const raw = req.params.id;
  if (typeof raw !== 'string') {
    sendResponse(res, errors.validation('Invalid survey ID'));
    return null;
  }
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    sendResponse(res, errors.validation('Invalid survey ID'));
    return null;
  }
  return id;
}

surveyRouter.get('/mySurveys', authenticateToken, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const result = await getMySurveys(user.id);
  sendResponse(res, result);
});

surveyRouter.get('/responses/:id', authenticateToken, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const surveyId = requireSurveyId(req, res);
  if (surveyId === null) return;

  const result = await getSurveyAnswers(user, surveyId);
  sendResponse(res, result);
});

surveyRouter.get('/', async (_req, res) => {
  const result = await getSurveys();
  sendResponse(res, result);
});

surveyRouter.get('/:id/responded', authenticateToken, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const surveyId = requireSurveyId(req, res);
  if (surveyId === null) return;

  const result = await hasUserRespondedToSurvey(surveyId, user.id);
  sendResponse(res, result);
});

surveyRouter.get('/:id', async (req, res) => {
  const surveyId = requireSurveyId(req, res);
  if (surveyId === null) return;

  const result = await getSurveyById(surveyId);
  sendResponse(res, result);
});

surveyRouter.post('/:id/responses', authenticateToken, validateAnswers, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const surveyId = requireSurveyId(req, res);
  if (surveyId === null) return;

  const result = await submitResponse(user.id, surveyId, req.body.answers);
  sendResponse(res, result);
});

surveyRouter.post('/', authenticateToken, validateSurvey, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const result = await createSurvey(user, req.body.title, req.body.questions);
  sendResponse(res, result);
});

surveyRouter.put('/edit/:id', authenticateToken, validateSurvey, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const surveyId = requireSurveyId(req, res);
  if (surveyId === null) return;

  const result = await updateSurvey(user, surveyId, req.body.title, req.body.questions);
  sendResponse(res, result);
});

surveyRouter.delete('/:id', authenticateToken, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const surveyId = requireSurveyId(req, res);
  if (surveyId === null) return;

  const result = await deleteSurvey(user, surveyId);
  sendResponse(res, result);
});

export default surveyRouter;