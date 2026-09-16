import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
import type { PublicUser } from "../types.ts";
import { fail, sendResponse } from "../utils/helpers.ts";

dotenv.config();

export function authenticateToken(req: Request, res: Response, next: NextFunction){
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

if (!token){
    return sendResponse(res, fail('Access token required', 'INVALID_CREDENTIALS'))
}
try{
const user = jwt.verify(token, process.env.JWT_SECRET || '') as PublicUser;
req.user = user;
next();
} catch {
     return sendResponse(res, fail('Invalid or expired token', 'FORBIDDEN'))
}
}