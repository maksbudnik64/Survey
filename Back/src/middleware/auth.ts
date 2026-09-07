import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
import type { PublicUser } from "../types.ts";

dotenv.config();

export function authenticateToken(req: Request, res: Response, next: NextFunction){
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

if (!token){
    return res.status(401).json({
            success: false,
            error: "Access token required",
        });
}
try{
const user = jwt.verify(token, process.env.JWT_SECRET || '') as PublicUser;
req.user = user;
next();
} catch {
     return res.status(403).json({
            success: false,
            error: "Invalid or expired token",
        });
}
}