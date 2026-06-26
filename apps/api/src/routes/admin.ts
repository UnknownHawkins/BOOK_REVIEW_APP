import { Router } from "express";
import {
  getUsers,
  updateUserRole,
  deleteUser,
  getAnalytics,
  getLogs,
  getReports,
  updateReportStatus,
} from "../controllers/admin";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

// Protect all routes with authentication and admin role check
router.use(requireAuth);
router.use(requireAdmin);

router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/analytics", getAnalytics);
router.get("/logs", getLogs);
router.get("/reports", getReports);
router.put("/reports/:id", updateReportStatus);

export default router;
