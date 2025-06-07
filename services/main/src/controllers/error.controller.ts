import { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/error.util";

const errorController = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
    let statusCode: number = err.statusCode || 500;
    let message: string = err.message || "internal server error";
    let errors: any = err.errors || null;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }

    res.status(statusCode).json({
        message,
        errors
    });
    return;
};

const notFoundController = (_req: Request, res: Response): void => {
    res.status(404).json({
        message: "not found"
    });
    return;
};

export { errorController, notFoundController };