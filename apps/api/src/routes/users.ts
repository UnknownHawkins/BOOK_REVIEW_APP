import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getLibrary,
  addToLibrary,
  updateLibraryProgress,
  getWishlist,
  toggleWishlist,
  getFavorites,
  toggleFavorite,
  deleteAccount,
  exportUserData,
  getReadingInsights,
} from "../controllers/users";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.put("/me", requireAuth, updateProfile);
router.get("/me/library", requireAuth, getLibrary);
router.post("/me/library", requireAuth, addToLibrary);
router.put("/me/library/:bookId", requireAuth, updateLibraryProgress);
router.get("/me/wishlist", requireAuth, getWishlist);
router.post("/me/wishlist", requireAuth, toggleWishlist);
router.get("/me/favorites", requireAuth, getFavorites);
router.post("/me/favorites", requireAuth, toggleFavorite);
router.delete("/me", requireAuth, deleteAccount);
router.get("/me/export", requireAuth, exportUserData);
router.get("/me/insights", requireAuth, getReadingInsights);

export default router;
