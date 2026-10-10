import type { Request, Response, NextFunction } from "express";
import { errors, sendResponse } from "../utils/helpers.ts";
import {
    MAX_ANSWERS_JSON_SIZE,
    MAX_TEXT_ANSWER_LENGTH,
    MAX_ANSWERS_COUNT,
} from "../constants.ts";

export function validateAnswers(req: Request, res: Response, next: NextFunction) {
    const jsonString = JSON.stringify(req.body);
    if (jsonString.length > MAX_ANSWERS_JSON_SIZE) {
        return sendResponse(res, errors.validation(
            `Answers payload too large (max ${MAX_ANSWERS_JSON_SIZE} bytes)`
        ));
    }

    const { answers } = req.body;
    if (!answers) {
        return sendResponse(res, errors.validation("Answers are required"));
    }

    if (typeof answers !== 'object' || Array.isArray(answers)) {
        return sendResponse(res, errors.validation("Answers must be an object"));
    }

    const keys = Object.keys(answers);
    if (keys.length === 0) {
        return sendResponse(res, errors.validation("Answers cannot be empty"));
    }
    if (keys.length > MAX_ANSWERS_COUNT) {
        return sendResponse(res, errors.validation(
            `Too many answers (max ${MAX_ANSWERS_COUNT})`
        ));
    }

    for (const key of keys) {
        if (!/^\d+$/.test(key)) {
            return sendResponse(res, errors.validation(`Invalid question ID: ${key}`));
        }

        const value = answers[key];

        if (value === null || value === undefined) {
            return sendResponse(res, errors.validation(`Answer for question ${key} is empty`));
        }

        if (typeof value === 'string') {
            if (value.length > MAX_TEXT_ANSWER_LENGTH) {
                return sendResponse(res, errors.validation(
                    `Answer for question ${key} is too long (max ${MAX_TEXT_ANSWER_LENGTH})`
                ));
            }
            continue;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return sendResponse(res, errors.validation(
                    `Answer for question ${key} cannot be empty array`
                ));
            }
            if (value.length > 20) {
                return sendResponse(res, errors.validation(
                    `Too many options selected for question ${key}`
                ));
            }
            for (const item of value) {
                if (typeof item !== 'string') {
                    return sendResponse(res, errors.validation(
                        `Answer items for question ${key} must be strings`
                    ));
                }
                if (item.length > 500) {
                    return sendResponse(res, errors.validation(
                        `Answer item for question ${key} is too long`
                    ));
                }
            }
            continue;
        }

        return sendResponse(res, errors.validation(
            `Answer for question ${key} has invalid type`
        ));
    }

    next();
}