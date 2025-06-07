// handle error of express-validator
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { BadRequestError } from "../utils/error.util";

const validate = (req: Request, _: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new BadRequestError("validation error", errors.array());
    }

    return next();
}

export default validate;
