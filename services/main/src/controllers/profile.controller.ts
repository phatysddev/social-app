import { Response, NextFunction } from "express";
import fs from "fs";

import { AppRequest } from "../models/net.model";
import prisma from "../utils/prisma.util";
import { NotFoundError } from "../utils/error.util";

export const getProfileController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.user as { id: string };

        const profile = await prisma.profile.findUnique({
            where: {
                userId: id
            }
        });

        if (!profile) {
            throw new NotFoundError("profile not found");
        }

        res.status(200).json({
            message: "profile fetched successfully",
            data: profile
        });
    } catch (error) {
        return next(error);
    }
};

export const getProfileByAnotherUserController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const profile = await prisma.profile.findUnique({
            where: {
                userId: id
            },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });

        if (!profile) {
            throw new NotFoundError("profile not found");
        }
        
        res.status(200).json({
            message: "profile fetched successfully",
            data: profile
        });
    } catch (error) {
        return next(error);
    }
}

export const updateProfileController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.user as { id: string };

        const { bio } = req.body;
        const image = req.file;

        const profile = await prisma.profile.findUnique({
            where: {
                userId: id
            }
        });
        
        if (!profile) {
            throw new NotFoundError("profile not found");
        }

        const newProfile = await prisma.profile.update({
            where: {
                userId: id
            },
            data: {
                bio: bio ?? profile.bio,
                avatar: image ? `/${image?.path}` : profile.avatar,

            }
        });

        if (!newProfile) {
            throw new NotFoundError("profile not found");
        }

        if (image && profile.avatar) {
            await fs.unlinkSync("." + profile.avatar)
        }

        res.status(200).json({
            message: "profile updated successfully",
            data: newProfile
        });
    } catch (error) {
        return next(error);
    }
};
