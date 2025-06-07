import { Response, NextFunction, Express, Request } from "express";
import fs from "fs";

import { AppRequest } from "../models/net.model";
import prisma from "../utils/prisma.util";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../utils/error.util";
import { CommentResponse, PostsResponse } from "../models/post.model";

export const createPostController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { content, visibility } = req.body;
        const images = (req as any).files as any[];
        const post = await prisma.post.create({
            data: {
                content,
                images: { create: images.map((image) => ({ url: `/uploads/${image.filename}` })) },
                user: { connect: { id: req.user!.id } },
                visibility: visibility ?? "PUBLIC"
            },
        });

        if (!post) {
            throw new BadRequestError("failed to create post");
        }

        res.status(201).json({
            message: "post created successfully",
            post
        });
    } catch (error) {
        return next(error);
    }
};
//     try {
//         const { page = 1, limit = 10 } = req.query;
//         const posts = await prisma.post.findMany({
//             include: { 
//                 images: true,
//                 user: {
//                     select: {
//                         id: true,
//                         username: true,
//                         profile: {
//                             select: {
//                                 avatar: true
//                             }
//                         },
//                     }
//                 },
//                 comments: {
//                     select: {
//                         user: {
//                             select: {
//                                 username: true,
//                                 profile: {
//                                     select: {
//                                         avatar: true
//                                     }
//                                 }
//                             }
//                         },
//                         content: true
//                     }
//                 },
//                 _count: {
//                     select: {
//                         comments: true,
//                         likes: true
//                     }
//                 }
//             },
//             skip: (Number(page) - 1) * Number(limit),
//             take: Number(limit)
//         });

//         if (!posts) {
//             throw new NotFoundError("posts not found");
//         }

//         res.status(200).json({
//             message: "posts fetched successfully",
//             posts
//         });
//     } catch (error) {
//         return next(error);
//     }
// };

export const getPostsController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page = 1, limit = 10 } = req.query;
        if (req.user?.id) {
            const user = await prisma.user.findFirst({
                where: { id: req.user!.id },
                select: {
                    likes: true,
                    id: true
                }
            });
            if (!user) {
                throw new NotFoundError("not found user");
            }
            const viewerId = user.id;
            const posts = await prisma.post.findMany({
                where: {
                    OR: [
                        { userId: viewerId },
                        { visibility: "PUBLIC" },
                        {
                            AND: [
                                { visibility: "FRIEND_ONLY" },
                                {
                                    user: {
                                        profile: {
                                            followers: {
                                                some: {
                                                    following: {
                                                        userId: viewerId
                                                    }
                                                }
                                            },
                                            following: {
                                                some: {
                                                    follower: {
                                                        userId: viewerId
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                orderBy: {
                    updatedAt: "desc"
                },
                select: {
                    id: true,
                    user: {
                        select: {
                            username: true,
                            id: true,
                            profile: {
                                select: {
                                    avatar: true
                                }
                            }
                        }
                    },
                    content: true,
                    visibility: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            comments: true,
                            likes: true
                        }
                    }
                }
            });

            const response: PostsResponse[] = posts.map(v => {
                const result: PostsResponse = {
                    postId: v.id,
                    content: v.content,
                    comment_count: v._count.comments,
                    likes: v._count.likes,
                    liked: user.likes.some(v2 => v2.postId === v.id),
                    user: {
                        userId: v.user.id,
                        username: v.user.username,
                        avatar: v.user.profile!.avatar!
                    },
                    visibility: v.visibility,
                    updatedAt: v.updatedAt,
                    createdAt: v.createdAt
                }

                return result;
            });

            res.json({
                message: "find post successfully",
                data: response
            });
        } else {
            const posts = await prisma.post.findMany({ 
                where: { visibility: "PUBLIC" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                orderBy: {
                    updatedAt: "desc"
                },
                select: {
                    id: true,
                    user: {
                        select: {
                            username: true,
                            id: true,
                            profile: {
                                select: {
                                    avatar: true
                                }
                            }
                        }
                    },
                    content: true,
                    visibility: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            comments: true,
                            likes: true
                        }
                    }
                }
            });

            const response: PostsResponse[] = posts.map(v => {
                const result: PostsResponse = {
                    postId: v.id,
                    content: v.content,
                    comment_count: v._count.comments,
                    likes: v._count.likes,
                    liked: false,
                    user: {
                        userId: v.user.id,
                        username: v.user.username,
                        avatar: v.user.profile!.avatar!
                    },
                    visibility: v.visibility,
                    updatedAt: v.updatedAt,
                    createdAt: v.createdAt
                }

                return result;
            });

            res.json({
                message: "find post successfully",
                data: response
            })
        }
    } catch (error) {
        return next(error);
    }
};

export const getPostByIdController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (req.user?.id) {
            const user = await prisma.user.findFirst({
                where: { id: req.user!.id },
                select: {
                    likes: true,
                    id: true
                }
            });
            if (!user) {
                throw new NotFoundError("user not found")
            }
            const viewerId = user.id;

            const post = await prisma.post.findFirst({
                where: {
                    OR: [
                        { visibility: "PUBLIC", id },
                        { id, userId: viewerId },
                        {
                            visibility: "FRIEND_ONLY",
                            id,
                            user: {
                                profile: {
                                    followers: {
                                        some: {
                                            following: {
                                                userId: viewerId
                                            }
                                        }
                                    },
                                    following: {
                                        some: {
                                            follower: {
                                                userId: viewerId
                                            }
                                        }
                                    }
                                }
                            }
                        },
                    ]
                },
                select: {
                    id: true,
                    user: {
                        select: {
                            username: true,
                            id: true,
                            profile: {
                                select: {
                                    avatar: true
                                }
                            }
                        }
                    },
                    content: true,
                    visibility: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            comments: true,
                            likes: true
                        }
                    }
                }
            });

            if (!post) {
                throw new NotFoundError("post not found");
            }

            const response: PostsResponse = {
                postId: post.id,
                content: post.content,
                comment_count: post._count.comments,
                likes: post._count.likes,
                liked: user.likes.some(v => v.postId === post.id),
                visibility: post.visibility,
                user: {
                    userId: post.user.id,
                    username: post.user.username,
                    avatar: post.user.profile!.avatar!
                },
                createdAt: post.createdAt,
                updatedAt: post.updatedAt
            };

            res.status(200).json({ message: "find post successfully", data: response });
        } else {
            const post = await prisma.post.findFirst({
                where: { id, visibility: "PUBLIC" },
                select: {
                    id: true,
                    user: {
                        select: {
                            username: true,
                            id: true,
                            profile: {
                                select: {
                                    avatar: true
                                }
                            }
                        }
                    },
                    content: true,
                    visibility: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            comments: true,
                            likes: true
                        }
                    }
                }
            });

            if (!post) {
                throw new NotFoundError("post not found");
            }

            const response: PostsResponse = {
                postId: post.id,
                content: post.content,
                comment_count: post._count.comments,
                likes: post._count.likes,
                liked: false,
                visibility: post.visibility,
                user: {
                    userId: post.user.id,
                    username: post.user.username,
                    avatar: post.user.profile!.avatar!
                },
                createdAt: post.createdAt,
                updatedAt: post.updatedAt
            };

            res.status(200).json({ message: "find post successfully", data: response });
        }
    } catch (error) {
        return next(error);
    }
};

export const updatePostController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const post = await prisma.post.findUnique({ where: { id } });

        if (!post) {
            throw new NotFoundError("post not found")
        }

        if (post.userId !== req.user!.id) {
            throw new UnauthorizedError("user not allow")
        }

        const updatePost = await prisma.post.update({
            where: { id },
            data: { content }
        });

        res.status(200).json({
            message: "post updated successfully",
            updatePost
        });
    } catch (error) {
        return next(error);
    }
};

export const deletePostController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const post = await prisma.post.findUnique({ 
            where: { id },
            include: { images: { select: { url: true } } }
        });

        if (!post) {
            throw new NotFoundError("post not found");
        }

        if (post.userId !== req.user!.id) {
            throw new UnauthorizedError("user not allow");
        }

        await prisma.post.delete({ where: { id } });

        await Promise.all(
            post.images.map(async image => {
                try {
                    await fs.unlink("." + image.url, () => {});
                } catch (error) {
                    console.error(`failed to delete image: ${image.url}`, error);
                }
            })
        );

        res.status(200).json({ message: "post deleted successfully" });
    } catch (error) {
        return next(error);
    }
};

export const likePostController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const postId = req.params.id;
        if (!postId) {
            throw new BadRequestError("invalid post ID");
        }

        const userId = req.user!.id;

        const postExists = await prisma.post.findFirst({
            where: { id: postId },
            select: { userId: true }
        });

        if (!postExists) {
            throw new NotFoundError("post not found")
        }

        const existingLike = await prisma.like.findFirst({
            where: { postId, userId }
        });

        if (existingLike) {
            throw new ConflictError("already liked this post")
        }

        await prisma.like.create({
            data: { userId, postId }
        });

        res.status(200).json({ message: "liked this post successfully" });
    } catch (error) {
        return next(error);
    }
};

export const unlikePostController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const postId = req.params.id;
        if (!postId) {
            throw new BadRequestError("invalid post ID");
        }

        const userId = req.user!.id;

        const postExists = await prisma.post.findFirst({
            where: { id: postId },
            select: { userId: true }
        });

        if (!postExists) {
            throw new NotFoundError("post not found");
        }

        const existingLike = await prisma.like.findFirst({
            where: { postId, userId }
        });

        if (!existingLike) {
            throw new BadRequestError("user not like post")
        }

        await prisma.like.delete({
            where: { id: existingLike.id }
        });

        res.status(200).json({ message: "unliked this post successfully" });
    } catch (error) {
        return next(error);
    }
};

export const commentPostController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const user = await prisma.user.findFirst({ where: { id: req.user!.id } });
        if (!user) {
            throw new NotFoundError("user not found");
        }

        if (!id) {
            throw new BadRequestError("invalid post id");
        }
        if (!content) {
            throw new BadRequestError("invalid content");
        }

        const postExists = await prisma.post.findFirst({ where: { id } });

        if (!postExists) {
            throw new NotFoundError("post not found");
        }

        await prisma.comment.create({
            data: {
                content,
                user: { connect: { id: user.id } },
                post: { connect: { id: postExists.id } }
            }
        });

        res.status(200).json({
            message: "comment post successfully"
        });
    } catch (error) {
        return next(error);
    }
};

export const getCommentPostController = async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findFirst({ where: { id: req.user!.id } });
        if (!user) {
            throw new NotFoundError("user not found");
        }

        const comments = await prisma.comment.findMany({
            where: {
                postId: id,
                post: {
                    OR: [
                        { visibility: "PUBLIC" },
                        { userId: user.id },
                        {
                            user: {
                                profile: {
                                    followers: {
                                        some: {
                                            following: {
                                                userId: user.id
                                            }
                                        }
                                    },
                                    following: {
                                        some: {
                                            follower: {
                                                userId: user.id
                                            }
                                        }
                                    }
                                }
                            },
                            NOT: [
                                { visibility: "PRIVATE" }
                            ]
                        }
                    ]
                }
            },
            select: {
                content: true,
                id: true,
                user: {
                    select: {
                        username: true,
                        profile: {
                            select: {
                                avatar: true
                            }
                        },
                        id: true
                    }
                }
            }
        });

        const response: CommentResponse[] = comments.map(v => {
            const result: CommentResponse = {
                commentId: v.id,
                content: v.content,
                user: {
                    userId: v.user.id,
                    username: v.user.username,
                    avatar: v.user.profile!.avatar!
                }
            };

            return result;
        });

        res.json({
            message: "find comment successfully",
            data: response
        });
    } catch (error) {
        return next(error);
    }
};
