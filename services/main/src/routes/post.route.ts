import { Router } from "express";
import multer from "multer";


import { createPostController, getPostsController, getPostByIdController, updatePostController, deletePostController, likePostController, unlikePostController, commentPostController, getCommentPostController } from "../controllers/post.controller";
import { verifyTokenMiddleware, verifyTokenOptionMiddleware } from "../middlewares/token.middleware";

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "uploads/");
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const router: Router = Router();
const upload = multer({ storage });

// Create new post
router.post(
    "/",
    verifyTokenMiddleware,
    upload.array("images"),
    createPostController
);

// Get all own post or another PUBLIC post and friend FRIEND_ONLY post
router.get(
    "/",
    verifyTokenOptionMiddleware,
    getPostsController
);

// Get one post by id
router.get(
    "/:id",
    verifyTokenOptionMiddleware,
    getPostByIdController
);

// Update own post
router.put(
    "/:id",
    verifyTokenMiddleware,
    upload.none(),
    updatePostController
);

// Delete own post
router.delete(
    "/:id",
    verifyTokenMiddleware,
    deletePostController
);

// Like post
router.post(
    "/like/:id",
    verifyTokenMiddleware,
    likePostController
);

// Unlike post
router.post(
    "/unlike/:id",
    verifyTokenMiddleware,
    unlikePostController
);

// Create comment on post
router.post(
    "/:id/comment",
    verifyTokenMiddleware,
    commentPostController
);

// Get all comment on post
router.get(
    "/:id/comment",
    verifyTokenOptionMiddleware,
    getCommentPostController
);

export default router;