import { Router } from "express";
import {
  getReviews,
  createReview,
  editReview,
  deleteReview,
  likeReview,
  getComments,
  addComment,
  addReply,
  reportReview,
} from "../controllers/reviews";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", getReviews);
router.post("/", requireAuth, createReview);
router.put("/:id", requireAuth, editReview);
router.delete("/:id", requireAuth, deleteReview);
router.post("/:id/like", requireAuth, likeReview);
router.get("/:id/comments", getComments);
router.post("/:id/comments", requireAuth, addComment);
router.post("/comments/:id/replies", requireAuth, addReply);
router.post("/:id/report", requireAuth, reportReview);

export default router;
