import express from "express";
import { getReviews, createReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

router.get("/", getReviews);
router.post("/", protect, createReview);

export default router;
