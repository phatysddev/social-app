class AppError extends Error implements Error {
    public errors?: any;

    constructor(public message: string, public statusCode: number) {
        super(message);
    }
}

class BadRequestError extends AppError {
    constructor(message: string, errors?: any) {
        super(message, 400);
        this.errors = errors;
    }
}

class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message: string) {
        super(message, 403);
    }
}

class InternalServerError extends AppError {
    constructor(message: string) {
        super(message, 500);
    }
} 

class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}

export { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError, InternalServerError, ConflictError };
export { AppError };