import { Router } from "express";
import { searchBooks } from "../controllers/search";

const router = Router();

router.get("/", searchBooks);

export default router;
