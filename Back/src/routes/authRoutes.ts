import { Router } from "express";
import { createUser, login } from "../services/authService.ts";
import { validateLogin, validateRegistration } from "../validators/authValidator.ts";
import { sendResponse } from "../utils/helpers.ts";

const authRouter = Router();

authRouter.post("/registration", validateRegistration, async (req, res) => {
    const result = await createUser(req.body.email, req.body.password);
    return sendResponse(res, result);
});

authRouter.post("/login", validateLogin, async (req, res) => {
    const result = await login (req.body.email, req.body.password)
    return sendResponse(res, result);
})

export default authRouter;