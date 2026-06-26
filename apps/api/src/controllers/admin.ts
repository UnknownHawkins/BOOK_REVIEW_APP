import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { logger } from "../config/logger";

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ status: "success", users });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== "admin" && role !== "user") {
      throw new BadRequestError("Invalid role value. Must be 'admin' or 'user'");
    }

    // Don't let users de-privilege themselves if they are the only admin
    if (id === req.user!.id && role === "user") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        throw new BadRequestError("Cannot downgrade yourself. You are the only administrator.");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: req.user!.id,
        action: "UPDATE_USER_ROLE",
        details: `Updated user ${updatedUser.username} (${id}) role to ${role}`,
      },
    });

    res.status(200).json({ status: "success", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      throw new NotFoundError("User not found");
    }

    if (userToDelete.role === "admin" && userToDelete.id === req.user!.id) {
      throw new BadRequestError("You cannot delete your own account from the Admin Panel.");
    }

    await prisma.user.delete({ where: { id } });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: req.user!.id,
        action: "DELETE_USER",
        details: `Deleted user ${userToDelete.username} (${id})`,
      },
    });

    res.status(200).json({ status: "success", message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalBooks = await prisma.book.count();
    const totalReviews = await prisma.review.count();
    const totalRatings = await prisma.rating.count();

    // Vibes count across all reviews
    const vibes = await prisma.review.groupBy({
      by: ["vibe"],
      _count: { vibe: true },
    });

    // Books by category
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: { books: true },
        },
      },
    });

    // Reading Status breakdown
    const readingHistoryStatus = await prisma.readingHistory.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    res.status(200).json({
      status: "success",
      analytics: {
        counts: {
          users: totalUsers,
          books: totalBooks,
          reviews: totalReviews,
          ratings: totalRatings,
        },
        vibesDistribution: vibes.map((v) => ({ name: v.vibe || "neutral", count: v._count.vibe })),
        categoriesDistribution: categories.map((c) => ({ name: c.name, count: c._count.books })),
        readingStatusBreakdown: readingHistoryStatus.map((r) => ({ name: r.status, count: r._count.status })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminLogs = await prisma.adminLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true } },
      },
    });

    const activityLogs = await prisma.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true } },
      },
    });

    res.status(200).json({
      status: "success",
      adminLogs,
      activityLogs,
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: { select: { username: true } },
        review: {
          include: {
            user: { select: { username: true } },
            book: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      status: "success",
      reports,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // RESOLVED, DISMISSED, PENDING

    if (status !== "RESOLVED" && status !== "DISMISSED" && status !== "PENDING") {
      throw new BadRequestError("Invalid status value");
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundError("Report not found");
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { status },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: req.user!.id,
        action: "UPDATE_REPORT_STATUS",
        details: `Updated report ${id} status to ${status}`,
      },
    });

    res.status(200).json({ status: "success", report: updatedReport });
  } catch (error) {
    next(error);
  }
};
