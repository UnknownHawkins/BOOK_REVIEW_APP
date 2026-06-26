import { Request, Response, NextFunction } from "express";
import { UpdateProgressSchema, AddToLibrarySchema } from "@bookhub/shared";
import { prisma } from "../config/db";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { logger } from "../config/logger";

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            readingHistory: true,
            favorites: true,
            wishlist: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.status(200).json({
      status: "success",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { username, email, avatar } = req.body;

    // Check unique username if changing
    if (username) {
      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new BadRequestError("Username is already taken");
      }
    }

    // Check unique email if changing
    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new BadRequestError("Email is already registered");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    res.status(200).json({
      status: "success",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const library = await prisma.readingHistory.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            authors: true,
            categories: true,
          },
        },
      },
      orderBy: { lastReadAt: "desc" },
    });

    res.status(200).json({
      status: "success",
      library,
    });
  } catch (error) {
    next(error);
  }
};

export const addToLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { bookId, status, pagesRead = 0 } = await AddToLibrarySchema.parseAsync(req.body);

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundError(`Book with ID ${bookId} not found`);
    }

    const entry = await prisma.readingHistory.upsert({
      where: {
        userId_bookId: { userId, bookId },
      },
      update: {
        status,
        pagesRead: status === "COMPLETED" ? (book.pages || pagesRead) : pagesRead,
        lastReadAt: new Date(),
      },
      create: {
        userId,
        bookId,
        status,
        pagesRead: status === "COMPLETED" ? (book.pages || pagesRead) : pagesRead,
      },
      include: {
        book: {
          include: {
            authors: true,
          },
        },
      },
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId,
        action: "ADD_TO_LIBRARY",
        details: `Added ${book.title} to library with status ${status}`,
      },
    });

    res.status(200).json({
      status: "success",
      entry,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLibraryProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { bookId } = req.params;
    const { status, pagesRead } = await UpdateProgressSchema.parseAsync(req.body);

    const entry = await prisma.readingHistory.findUnique({
      where: { userId_bookId: { userId, bookId } },
      include: { book: true },
    });

    if (!entry) {
      throw new NotFoundError("Book is not in your library. Add it first.");
    }

    let finalPagesRead = pagesRead !== undefined ? pagesRead : entry.pagesRead;
    let finalStatus = status || entry.status;

    // Boundary check
    if (entry.book.pages && finalPagesRead > entry.book.pages) {
      finalPagesRead = entry.book.pages;
    }

    if (entry.book.pages && finalPagesRead === entry.book.pages) {
      finalStatus = "COMPLETED";
    }

    if (finalStatus === "COMPLETED" && entry.book.pages) {
      finalPagesRead = entry.book.pages;
    }

    const updatedEntry = await prisma.readingHistory.update({
      where: { id: entry.id },
      data: {
        status: finalStatus,
        pagesRead: finalPagesRead,
        lastReadAt: new Date(),
      },
      include: {
        book: {
          include: {
            authors: true,
          },
        },
      },
    });

    // Log progress update
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_PROGRESS",
        details: `Updated ${entry.book.title} progress: page ${finalPagesRead}/${entry.book.pages || "?"} (${finalStatus})`,
      },
    });

    res.status(200).json({
      status: "success",
      entry: updatedEntry,
    });
  } catch (error) {
    next(error);
  }
};

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            authors: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { bookId } = req.body;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundError(`Book with ID ${bookId} not found`);
    }

    const existing = await prisma.wishlist.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      res.status(200).json({ status: "success", added: false });
    } else {
      await prisma.wishlist.create({
        data: { userId, bookId },
      });
      res.status(200).json({ status: "success", added: true });
    }
  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            authors: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      favorites,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { bookId } = req.body;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundError(`Book with ID ${bookId} not found`);
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      res.status(200).json({ status: "success", added: false });
    } else {
      await prisma.favorite.create({
        data: { userId, bookId },
      });
      res.status(200).json({ status: "success", added: true });
    }
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Delete user (Prisma onDelete: Cascade will clean up related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.clearCookie("token");
    res.clearCookie("refreshToken");

    res.status(200).json({
      status: "success",
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error) {
    next(error);
  }
};

export const exportUserData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reviews: true,
        ratings: true,
        comments: true,
        readingHistory: { include: { book: { select: { title: true } } } },
        favorites: { include: { book: { select: { title: true } } } },
        wishlist: { include: { book: { select: { title: true } } } },
        activityLogs: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.setHeader("Content-disposition", `attachment; filename=bookhub-user-data-${user.username}.json`);
    res.setHeader("Content-type", "application/json");
    res.status(200).send(JSON.stringify(user, null, 2));
  } catch (error) {
    next(error);
  }
};

export const getReadingInsights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const readingEntries = await prisma.readingHistory.findMany({
      where: { userId },
      include: {
        book: {
          include: { categories: true },
        },
      },
    });

    // 1. Calculations
    const totalBooks = readingEntries.length;
    const completedBooks = readingEntries.filter((r) => r.status === "COMPLETED").length;
    const readingBooks = readingEntries.filter((r) => r.status === "READING").length;
    const totalPagesRead = readingEntries.reduce((sum, r) => sum + r.pagesRead, 0);

    // 2. Favorite Genres (based on category names of completed/reading books)
    const genreCounts: { [key: string]: number } = {};
    readingEntries.forEach((entry) => {
      entry.book.categories.forEach((cat) => {
        genreCounts[cat.name] = (genreCounts[cat.name] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // 3. Mock reading streak and velocity for visual dashboard value
    // (Calculated relative to ActivityLogs)
    const logs = await prisma.activityLog.findMany({
      where: { userId, action: "UPDATE_PROGRESS" },
      orderBy: { createdAt: "desc" },
    });

    let currentStreak = 0;
    if (logs.length > 0) {
      // Basic check: did they read in the last 24h?
      const lastRead = new Date(logs[0].createdAt).getTime();
      const diffHrs = (Date.now() - lastRead) / (1000 * 60 * 60);
      if (diffHrs < 48) {
        currentStreak = 1;
        // Count consecutive distinct days
        let prevDateString = new Date(logs[0].createdAt).toDateString();
        for (let i = 1; i < logs.length; i++) {
          const currentDateString = new Date(logs[i].createdAt).toDateString();
          if (currentDateString !== prevDateString) {
            const diffDays = (new Date(prevDateString).getTime() - new Date(currentDateString).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays <= 1.5) {
              currentStreak++;
              prevDateString = currentDateString;
            } else {
              break;
            }
          }
        }
      }
    }

    res.status(200).json({
      status: "success",
      insights: {
        totalBooks,
        completedBooks,
        readingBooks,
        totalPagesRead,
        topGenres,
        currentStreak,
        pagesPerDay: completedBooks > 0 ? Math.ceil(totalPagesRead / 30) : 0, // mock standard average
      },
    });
  } catch (error) {
    next(error);
  }
};
