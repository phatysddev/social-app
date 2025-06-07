import { Router } from "express";

import testController from "../controllers/test.controller";
import authRouter from "./auth.route";
import profileRouter from "./profile.route";
import postRouter from "./post.route";
import followRouter from "./follow.route";

const router: Router = Router();

router.get("/test", testController);
router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/post", postRouter);
router.use("/follow", followRouter);

export default router;