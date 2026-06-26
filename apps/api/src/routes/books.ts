import { Router } from "express";
import { getBooks, getBookById, createBook, getTrendingBooks, getRecommendedBooks } from "../controllers/books";
import { getOrCreateDigitalBook } from "../controllers/digitalBooks";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth";

const router = Router();

router.get("/", getBooks);
router.get("/trending", getTrendingBooks);
router.get("/recommended", optionalAuth, getRecommendedBooks);
router.get("/:id", getBookById);
router.post("/:id/digital-book", requireAuth, getOrCreateDigitalBook);
router.post("/", requireAuth, createBook);

export default router;
