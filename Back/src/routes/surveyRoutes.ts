import { authenticateToken } from "../middleware/auth.ts";
import { Router } from "express";
import { getMySurveys } from "../services/surveyService.ts";

const surveyRouter = Router();

surveyRouter.get('/mySurveys', authenticateToken, async (req, res) => {
   if (!req.user) {
    return res.status(401).json({
        success: false,
        error: "User not authenticated",
    });
}
   const result = await getMySurveys(req.user.id);
   if(!result.success){
   return res.status(500).json(result);
   }
   return res.status(200).json(result);
})



export default surveyRouter;