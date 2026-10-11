import { Router } from 'express';
import { createUser, login } from '../services/authService.ts';
import { validateLogin, validateRegistration } from '../validators/authValidator.ts';
import { sendResponse } from '../utils/helpers.ts';

const authRouter = Router();

authRouter.post('/registration', validateRegistration, async (req, res) => {
  const { email, password } = req.body;
  const result = await createUser(email, password);
  sendResponse(res, result);
});

authRouter.post('/login', validateLogin, async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);
  sendResponse(res, result);
});

export default authRouter;