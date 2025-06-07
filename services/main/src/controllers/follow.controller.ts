import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import { AppRequest } from "../models/net.model";
import prisma from "../utils/prisma.util";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/error.util";
import { FollowResponse, GetOwnFollowerResponse } from "../models/follow.model";
import redisClient from "../configs/redis.config";

export const followingController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError("invalid user ID")
        }

        // Own profile
        const profileFollowing = await prisma.profile.findFirst({ where: { userId: req.user!.id }, include: { user: true } });
        // To profile
        const profileFollower = await prisma.profile.findFirst({ where: { userId: id }, include: { user: true } });

        if (!profileFollower || !profileFollowing) {
            throw new NotFoundError("follower or following not found");
        }

        if (profileFollower.userId === profileFollowing.userId) {
            throw new BadRequestError("follower and following is existing");
        }

        await prisma.follow.create({
            data: {
                // To
                follower: { connect: { id: profileFollower.id } },
                // From
                following: { connect: { id: profileFollowing.id }}
            }
        });

        const isFriend = await prisma.follow.findFirst({
            where: {
                // To
                follower: { userId: req.user!.id },
                // From
                following: { userId: id }
            }
        });

        const [userA, userB] = [profileFollower.userId, profileFollowing.userId].sort();
        const roomID: string = `${userA}_${userB}`;
        const key: string = `chat:room:${userA}:${userB}`;

        if (isFriend) {
            const success = await redisClient.set(key, JSON.stringify({
                roomID,
                user: {
                    [profileFollower.userId]: {
                        username: profileFollower.user.username,
                        avatar_url: profileFollower.avatar
                    },
                    [profileFollowing.userId]: {
                        username: profileFollowing.user.username,
                        avatar_url: profileFollowing.avatar
                    }
                },
                timestamp: Date.now()
            }));

            if (!success) {
                throw new BadRequestError("failed to create room chat")
            }
        }

        res.status(200).json({ message: "following user successfully" });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return next(new ConflictError("already following user"))
            } else if ( error.code === "P2025") {
                return next(new NotFoundError("user not found"))
            }
        }
        return next(error)
    }
};

export const unfollowController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError("invalid user ID");
        }

        const profiles = await prisma.profile.findMany({
            where: { userId: { in: [id, req.user!.id] } },
            select: {
                id: true,
                userId: true,
                followers: { select: { id: true } },
                following: { select: { id: true } }
            }
        });

        if (profiles.length < 2) {
            throw new NotFoundError("follower or following not found");
        }

        const profileFollower = profiles.find(p => p.userId === id);
        const profileFollowing = profiles.find(p => p.userId === req.user!.id);

        if (!profileFollower || !profileFollowing) {
            throw new NotFoundError("follower or following not found");
        }

        if (profileFollower.userId === profileFollowing.userId) {
            throw new BadRequestError("cannot unfollow yourself");
        }

        const followId = profileFollowing.following.find(f => 
            profileFollower.followers.some(f2 => f2.id === f.id)
        );

        if (!followId) {
            throw new NotFoundError("follow relationship not found");
        }
        
        await prisma.follow.deleteMany({
            where: { id: followId.id }
        });

        res.json({ message: "unfollowed successfully" });
    } catch (error) {
        return next(error);
    }
};


export const getOwnFollowController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await prisma.user.findFirst({
            where: { id: req.user!.id },
            select: {
                profile: {
                    select: {
                        followers: {
                            select: {
                                following: {
                                    select: {
                                        user: {
                                            select: {
                                                profile: {
                                                    select: {
                                                        avatar: true
                                                    }
                                                },
                                                username: true
                                            }
                                        }
                                    }
                                },
                            },
                        },
                        following: {
                            select: {
                                follower: {
                                    select: {
                                        user: {
                                            select: {
                                                profile: {
                                                    select: {
                                                        avatar: true
                                                    }
                                                },
                                                username: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        avatar: true,
                        _count: {
                            select: {
                                followers: true,
                                following: true
                            }
                        }
                    },
                },
                username: true,
            }
        });

        if (!user) {
            throw new NotFoundError("not found user");
        }

        const response: GetOwnFollowerResponse = {
            username: user!.username,
            avatar: user!.profile!.avatar,
            follower_count: user!.profile!._count!.followers,
            following_count: user!.profile!._count!.following,
            follower: [],
            following: []
        };

        user!.profile!.followers!.forEach(v => {
            const follower: FollowResponse = {
                username: v!.following!.user!.username,
                avatar: v!.following!.user!.profile!.avatar
            }
            response.follower.push(follower);
        });

        user!.profile!.following!.forEach(v => {
            const following: FollowResponse = {
                username: v!.follower!.user!.username,
                avatar: v!.follower!.user!.profile!.avatar
            }
            response.following.push(following);
        });

        res.status(200).json({ message: "find follower successfully", data: response });
    } catch (error) {
        return next(error);
    }
};

export const getFollowController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError("invalid user ID");
        }

        const user = await prisma.user.findFirst({
            where: { id },
            select: {
                profile: {
                    select: {
                        followers: {
                            select: {
                                following: {
                                    select: {
                                        user: {
                                            select: {
                                                profile: {
                                                    select: {
                                                        avatar: true
                                                    }
                                                },
                                                username: true
                                            }
                                        }
                                    }
                                },
                            },
                        },
                        following: {
                            select: {
                                follower: {
                                    select: {
                                        user: {
                                            select: {
                                                profile: {
                                                    select: {
                                                        avatar: true
                                                    }
                                                },
                                                username: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        avatar: true,
                        _count: {
                            select: {
                                followers: true,
                                following: true
                            }
                        }
                    },
                },
                username: true,
            }
        });

        if (!user) {
            throw new NotFoundError("not found user");
        }

        const response: GetOwnFollowerResponse = {
            username: user!.username,
            avatar: user!.profile!.avatar,
            follower_count: user!.profile!._count!.followers,
            following_count: user!.profile!._count!.following,
            follower: [],
            following: []
        };

        user!.profile!.followers!.forEach(v => {
            const follower: FollowResponse = {
                username: v!.following!.user!.username,
                avatar: v!.following!.user!.profile!.avatar
            }
            response.follower.push(follower);
        });

        user!.profile!.following!.forEach(v => {
            const following: FollowResponse = {
                username: v!.follower!.user!.username,
                avatar: v!.follower!.user!.profile!.avatar
            }
            response.following.push(following);
        });

        res.status(200).json({ message: "find follower successfully", data: response });
    } catch (error) {
        return next(error);
    }
};
