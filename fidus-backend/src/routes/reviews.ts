import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema } from "../validators/reviewValidators.js";
import * as reviewController from "../controllers/reviewController.js";

const router = Router();

router.post(
    '/create', 
    requireAuth, 
    validate(createReviewSchema),
    reviewController.createReview
);

export default router;