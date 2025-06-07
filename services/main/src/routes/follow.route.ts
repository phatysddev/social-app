import { Router } from "express";

import { followingController, getFollowController, getOwnFollowController, unfollowController } from "../controllers/follow.controller";
import { verifyTokenMiddleware } from "../middlewares/token.middleware";

const router: Router = Router();

// Follow 
router.post(
    "/following/:id", 
    verifyTokenMiddleware,
    followingController
);

// Get own follower
router.get(
    "/follower",
    verifyTokenMiddleware,
    getOwnFollowController
);

// Get another follower
router.get(
    "/follower/:id",
    verifyTokenMiddleware,
    getFollowController
);

// Unfollow
router.delete(
    "/unfollow/:id",
    verifyTokenMiddleware,
    unfollowController
);

export default router;