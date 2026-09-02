import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { signupSchema, loginSchema } from "../validators/authValidators.js";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/login", validate(loginSchema), authController.login);
router.get("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

export default router;
