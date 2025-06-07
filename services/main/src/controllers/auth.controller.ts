import { Request, Response, NextFunction } from "express";
import fs from "fs";

import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../utils/error.util";
import { hashPassword, verifyPassword } from "../utils/argon2.util";
import prisma from "../utils/prisma.util";
import { signRefreshToken, signToken, verifyRefreshToken } from "../utils/jwt.util";
import { AppRequest } from "../models/net.model";

export const registerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password, username } = req.body;

        {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { username }
                    ]
                }
            });
    
            if (user) {
                throw new ConflictError("user already exists");
            }
        }

        const hashedPassword: string = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                profile: {
                    create: {}
                }
            }
        });

        res.status(201).json({
            message: "user created successfully",
            data: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        return next(error);
    }
};

export const registerAdminController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const adminKey = req.body.adminKey;
        if (!(adminKey === process.env.APP_ADMIN_KEY)) {
            throw new ForbiddenError("invalid admin key");
        }

        const { email, username, password } = req.body;

        {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { username }
                    ]
                }
            });
    
            if (user) {
                throw new ConflictError("user already exists");
            }
        }

        const hashedPassword: string = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                profile: {},
                role: "ADMID"
            }
        });

        res.status(201).json({
            message: "admin user created successfully"
        });
    } catch (error) {
        return next(error);
    }
};

export const loginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, username, password } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
           
        if (!user) {
            throw new NotFoundError("user not found");
        }

        const isPasswordValid: boolean = await verifyPassword(password, user.password ?? "");

        if (!isPasswordValid) {
            throw new UnauthorizedError("invalid credentials");
        }

        const token: string = signToken({id: user.id, username: user.username});
        const refreshToken: string = signRefreshToken({id: user.id, username: user.username});

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: "strict"
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: "strict"
        });

        res.status(200).json({
            message: "login successful",
            data: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        return next(error);
    }
};

export const logoutController = async (_: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        res.clearCookie("token");
        res.clearCookie("refreshToken");

        res.status(200).json({
            message: "logout successful"
        });
    } catch (error) {
        return next(error);
    }
};

export const getRefreshTokenController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { refreshToken } = req.cookies;

        const decoded = verifyRefreshToken(refreshToken);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        });

        if (!user) {
            throw new UnauthorizedError("invalid refresh token");
        }

        const token: string = signToken({id: user.id, username: user.username});
        const newRefreshToken: string = signRefreshToken({id: user.id, username: user.username});
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: "strict"
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: "strict"
        });

        res.status(200).json({
            message: "refresh token successful"
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteAccountController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.user as { id: string };

        const user = await prisma.user.findFirst({
            where: { id },
            select: {
                profile: {
                    select: {
                        avatar: true
                    }
                }
            }
        });

        if (!user) {
            throw new NotFoundError("user not found");
        }

        await prisma.user.delete({
            where: {
                id
            }
        });

        if (user.profile?.avatar !== null || user.profile.avatar) {
            await fs.unlinkSync("." + user.profile?.avatar);
        }

        res.clearCookie("token");
        res.clearCookie("refreshToken");

        res.status(200).json({
            message: "account deleted successfully"
        });
    } catch (error) {
        return next(error)
    }
};
