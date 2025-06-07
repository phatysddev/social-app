import { Router } from "express";
import { body } from "express-validator";
import multer from "multer";

import { verifyTokenMiddleware } from "../middlewares/token.middleware";
import { getProfileController, updateProfileController, getProfileByAnotherUserController } from "../controllers/profile.controller";
import validate from "../middlewares/validate.middleware";

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

// Get own profile
router.get(
    "/",
    verifyTokenMiddleware,
    getProfileController
);

// update profile
router.put(
    "/update",
    verifyTokenMiddleware,
    upload.single("image"),
    updateProfileController
);

// Get another profile
router.get(
    "/:id",
    getProfileByAnotherUserController
);

export default router;
