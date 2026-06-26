import { Router } from "express";
import { recommendBooksAI, summarizeReviewsAI } from "../controllers/ai";
import { optionalAuth } from "../middlewares/auth";

const router = Router();

router.post("/recommend", optionalAuth, recommendBooksAI);
router.post("/summarize", summarizeReviewsAI);

export default router;
