import { Router } from "express";
import { body } from "express-validator";

import { loginController, logoutController, registerController, deleteAccountController, getRefreshTokenController, registerAdminController } from "../controllers/auth.controller";
import validate from "../middlewares/validate.middleware";
import { verifyTokenMiddleware } from "../middlewares/token.middleware";

const router = Router();

// Register new account
router.post(
    "/register", 
    body("email").isEmail().withMessage("invalid email"),
    body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
    body("username").isLength({ min: 3 }).withMessage("username must be at least 3 characters"),
    validate,
    registerController
);

// Register new admin account (disable)
router.post(
    "/admin/register",
    body("email").isEmail().withMessage("invalid email"),
    body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
    body("username").isLength({ min: 3 }).withMessage("username must be at least 3 characters"),
    validate,
    registerAdminController
);

// Login
router.post(
    "/login",
    body("email").isEmail().withMessage("invalid email").optional(),
    body("username").isLength({ min: 3 }).withMessage("username must be at least 3 characters").optional(),
    body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
    validate,
    loginController
);

// Logout
router.post(
    "/logout",
    verifyTokenMiddleware,
    logoutController
);

// Refresh token
router.post(
    "/refresh-token",
    getRefreshTokenController
);

// Remove account
router.delete(
    "/delete",
    verifyTokenMiddleware,
    deleteAccountController
)


export default router;