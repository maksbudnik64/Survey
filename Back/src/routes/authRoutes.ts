import { Router } from "express";
import { createUser, login } from "../services/authService.ts";

const authRouter = Router();

authRouter.post("/registration", async (req, res) => {
    const result = await createUser(req.body.email, req.body.password);

    if (!result.success) {
        return res.status(409).json(result);
    }

    return res.status(200).json(result);
});

authRouter.post("/login", async (req, res) => {
const result = await login (req.body.email, req.body.password)
if (!result.success) {
        return res.status(401).json(result);
    }

    return res.status(200).json(result);
})

export default authRouter;