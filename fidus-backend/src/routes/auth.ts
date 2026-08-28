import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { signupSchema, loginSchema } from "../validators/authValidators.js";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/login", validate(loginSchema), authController.login);

export default router;
