import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
import type { PublicUser } from "../types.ts";
import { fail, sendResponse } from "../utils/helpers.ts";
import { selectUserById } from "../repositories/userRepository.ts";

dotenv.config();

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return sendResponse(res, fail("Access token required", "UNAUTHORIZED"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as PublicUser;

        const result = await selectUserById(decoded.id);
        if (!result.success) {
            return sendResponse(res, fail("Failed to verify user", "DB_ERROR"));
        }
        if (!result.data) {
            return sendResponse(res, fail("User not found", "USER_NOT_FOUND"));
        }

        req.user = { id: result.data.id, email: result.data.email };
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return sendResponse(res, fail("Token expired", "TOKEN_EXPIRED"));
        }
        return sendResponse(res, fail("Invalid token", "INVALID_TOKEN"));
    }
}