// Check token and set user on request 
import { Response, NextFunction } from "express";

import { UnauthorizedError } from "../utils/error.util";
import { signToken, verifyRefreshToken, verifyToken } from "../utils/jwt.util";
import { AppRequest } from "../models/net.model";
import prisma from "../utils/prisma.util";

interface TokenPayload {
    id: string;
    username: string;
}

export const verifyTokenOptionMiddleware = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token: string | undefined = req.cookies.token;

        if (token) {
            const decoded = verifyToken(token) as unknown as TokenPayload;

            if (!(decoded instanceof Error)) {
                req.user = {
                    username: decoded.username,
                    id: decoded.id
                }

                return next();
            }
        }

        const refreshToken: string | undefined = req.cookies.refreshToken;

        if (!refreshToken) {
            return next();
        }

        const decoded = verifyRefreshToken(refreshToken) as unknown as TokenPayload;

        const user = await prisma.user.findFirst({
            where: { id: decoded.id }
        });

        if (!user) {
            return next();
        }

        const newToken = signToken({id: decoded.id, username: decoded.username});

        res.cookie("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: "strict"
        });

        req.user = {
            id: decoded.id,
            username: decoded.username
        }

        return next();
    } catch {
        return next()
    }
};

export const verifyTokenMiddleware = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token: string | undefined = req.cookies.token;

        if (token) {
            const decoded = verifyToken(token) as unknown as TokenPayload;

            if (!(decoded instanceof Error)) {
                req.user = {
                    username: decoded.username,
                    id: decoded.id
                }

                return next();
            }
        }

        const refreshToken: string | undefined = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new UnauthorizedError("unauthorized");
        }

        const decoded = verifyRefreshToken(refreshToken) as unknown as TokenPayload;

        const user = await prisma.user.findFirst({
            where: { id: decoded.id }
        });

        if (!user) {
            throw new UnauthorizedError("unauthorized")
        }

        const newToken = signToken({id: decoded.id, username: decoded.username});

        res.cookie("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: "strict"
        });

        req.user = {
            id: decoded.id,
            username: decoded.username
        }

        return next();
    } catch (error) {
        return next(error);
    }
};