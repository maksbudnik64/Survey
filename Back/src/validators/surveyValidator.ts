import type { NextFunction, Request, Response } from "express";
import { errors, sendResponse } from "../utils/helpers.ts";
import {
    MAX_TITLE_LENGTH,
    MAX_QUESTION_TEXT_LENGTH,
    MAX_OPTION_LENGTH,
    MAX_QUESTIONS,
    MAX_OPTIONS,
} from "../constants.ts";

export function validateSurvey(req: Request, res: Response, next: NextFunction){
    const { title, questions } = req.body;

    if(!title){
        return sendResponse(res, errors.validation('Survey title is required'))
    }

    if(typeof title !== 'string'){
        return sendResponse(res, errors.validation('Title must be a string'));
    }

    const clearTitle = title.trim();

    if (clearTitle.length === 0) {
        return sendResponse(res, errors.validation('Title cannot be empty'));
    }

    if (clearTitle.length > MAX_TITLE_LENGTH) {
        return sendResponse(res, errors.validation(`Title must be up to ${MAX_TITLE_LENGTH} chars`));
    }

    if (!questions) {
        return sendResponse(res, errors.validation('Questions are required'));
    }

    if (!Array.isArray(questions)) {
        return sendResponse(res, errors.validation('Questions must be an array'));
    }

    if (questions.length === 0) {
        return sendResponse(res, errors.validation('At least one question is required'));
    }

    if (questions.length > MAX_QUESTIONS) {
    return sendResponse(res, errors.validation(`Max ${MAX_QUESTIONS} questions allowed`));
    }

    for (const [index, q] of questions.entries()) {
        const error = validateQuestion(q, index);
        if (error) {
            return sendResponse(res, errors.validation(error));
        }
    }

    req.body.title = clearTitle;

    next();
}

function validateQuestion(q: any, index: number): string | null {
    const prefix = `Question ${index + 1}`;

    if (!q || typeof q !== 'object') {
        return `${prefix}: must be an object`;
    }

    if (typeof q.text !== 'string') {
        return `${prefix}: text must be a string`;
    }

    const clearText = q.text.trim();
    if (clearText.length === 0) {
        return `${prefix}: text cannot be empty`;
    }
    if (clearText.length > MAX_QUESTION_TEXT_LENGTH) {
        return `${prefix}: text must be up to ${MAX_QUESTION_TEXT_LENGTH} chars`;
    }

    if (q.type === 'text') {
        return null;
    }

    if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        if (!Array.isArray(q.options)) {
            return `${prefix}: options must be an array`;
        }
        if (q.options.length === 0) {
            return `${prefix}: at least one option required`;
        }
        if (q.options.length > MAX_OPTIONS) {
            return `${prefix}: max ${MAX_OPTIONS} options allowed`;
        }

        for (const [oi, opt] of q.options.entries()) {
            if (typeof opt !== 'string') {
                return `${prefix}: option ${oi + 1} must be a string`;
            }
            const clearOpt = opt.trim();
            if (clearOpt.length === 0) {
                return `${prefix}: option ${oi + 1} cannot be empty`;
            }
            if (clearOpt.length > MAX_OPTION_LENGTH) {
                return `${prefix}: option ${oi + 1} must be up to ${MAX_OPTION_LENGTH} chars`;
            }
        }

        return null;
    }

    return `${prefix}: invalid type "${q.type}"`;
}