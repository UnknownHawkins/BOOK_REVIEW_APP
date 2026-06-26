import { Request, Response, NextFunction } from "express";
import { CreateReviewSchema, EditReviewSchema, CreateCommentSchema, CreateReportSchema } from "@bookhub/shared";
import { prisma } from "../config/db";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors";
import { logger } from "../config/logger";

const updateBookAverageRating = async (bookId: string) => {
  const ratings = await prisma.rating.findMany({
    where: { bookId },
    select: { value: true },
  });

  if (ratings.length === 0) {
    await prisma.book.update({
      where: { id: bookId },
      data: { averageRating: 0.0 },
    });
    return;
  }

  const sum = ratings.reduce((acc, curr) => acc + curr.value, 0);
  const averageRating = parseFloat((sum / ratings.length).toFixed(1));

  await prisma.book.update({
    where: { id: bookId },
    data: { averageRating },
  });
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = "1", limit = "10", sortBy = "date", order = "desc" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let orderBy: any = {};
    if (sortBy === "likes") {
      orderBy = { likes: { _count: order } };
    } else if (sortBy === "rating") {
      orderBy = { ratingValue: order };
    } else {
      orderBy = { createdAt: order };
    }

    const [reviews, total] = await prisma.$transaction([
      prisma.review.findMany({
        skip,
        take: limitNum,
        orderBy,
        include: {
          user: {
            select: { id: true, username: true, avatar: true },
          },
          book: {
            select: { id: true, title: true, thumbnail: true },
          },
          likes: true,
          comments: {
            include: {
              user: { select: { id: true, username: true, avatar: true } },
            },
          },
        },
      }),
      prisma.review.count(),
    ]);

    res.status(200).json({
      status: "success",
      reviews,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { bookId, title, content, ratingValue, vibe, sticker } = await CreateReviewSchema.parseAsync(req.body);

    // Verify book exists
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundError(`Book with ID ${bookId} not found`);
    }

    // Check if user already reviewed this book
    const existingReview = await prisma.review.findFirst({
      where: { userId, bookId },
    });
    if (existingReview) {
      throw new BadRequestError("You have already reviewed this book. Edit your existing review instead.");
    }

    // Run in transaction to write review, rating, and update book stats
    const review = await prisma.$transaction(async (tx) => {
      // Upsert Rating
      await tx.rating.upsert({
        where: { userId_bookId: { userId, bookId } },
        update: { value: ratingValue },
        create: { userId, bookId, value: ratingValue },
      });

      // Create Review
      const newReview = await tx.review.create({
        data: {
          userId,
          bookId,
          title,
          content,
          ratingValue,
          vibe: vibe || "neutral",
          sticker: sticker || null,
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
        },
      });

      return newReview;
    });

    // Recalculate Average Rating (runs in background/async post-transaction)
    await updateBookAverageRating(bookId);

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE_REVIEW",
        details: `Created review for book: ${book.title}`,
      },
    });

    res.status(201).json({
      status: "success",
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const editReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, content, ratingValue, vibe, sticker } = await EditReviewSchema.parseAsync(req.body);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundError(`Review with ID ${id} not found`);
    }

    if (review.userId !== userId && req.user!.role !== "admin") {
      throw new ForbiddenError("You are not authorized to edit this review");
    }

    const updatedReview = await prisma.$transaction(async (tx) => {
      if (ratingValue !== undefined) {
        // Update Rating
        await tx.rating.upsert({
          where: { userId_bookId: { userId: review.userId, bookId: review.bookId } },
          update: { value: ratingValue },
          create: { userId: review.userId, bookId: review.bookId, value: ratingValue },
        });
      }

      const updated = await tx.review.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(ratingValue !== undefined && { ratingValue }),
          ...(vibe !== undefined && { vibe }),
          ...(sticker !== undefined && { sticker }),
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
        },
      });

      return updated;
    });

    if (ratingValue !== undefined) {
      await updateBookAverageRating(review.bookId);
    }

    res.status(200).json({
      status: "success",
      review: updatedReview,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundError(`Review with ID ${id} not found`);
    }

    if (review.userId !== userId && req.user!.role !== "admin") {
      throw new ForbiddenError("You are not authorized to delete this review");
    }

    await prisma.$transaction([
      prisma.review.delete({ where: { id } }),
      prisma.rating.deleteMany({
        where: { userId: review.userId, bookId: review.bookId },
      }),
    ]);

    await updateBookAverageRating(review.bookId);

    res.status(200).json({
      status: "success",
      message: "Review and associated rating deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const likeReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundError(`Review with ID ${id} not found`);
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_reviewId: { userId, reviewId: id },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      res.status(200).json({ status: "success", liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: { userId, reviewId: id },
      });

      // Create notification for review author (if not self)
      if (review.userId !== userId) {
        await prisma.notification.create({
          data: {
            userId: review.userId,
            title: "Review Liked",
            message: `${req.user!.username} liked your review for book.`,
          },
        });
      }

      res.status(200).json({ status: "success", liked: true });
    }
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // reviewId

    const comments = await prisma.comment.findMany({
      where: { reviewId: id },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        replies: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({
      status: "success",
      comments,
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params; // reviewId
    const { content } = await CreateCommentSchema.parseAsync(req.body);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundError(`Review with ID ${id} not found`);
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        reviewId: id,
        content,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    // Create notification
    if (review.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: review.userId,
          title: "New Comment",
          message: `${req.user!.username} commented on your review.`,
        },
      });
    }

    res.status(201).json({
      status: "success",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

export const addReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params; // commentId
    const { content } = await CreateCommentSchema.parseAsync(req.body); // reuse comment schema

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { review: true },
    });
    if (!comment) {
      throw new NotFoundError(`Comment with ID ${id} not found`);
    }

    const reply = await prisma.reply.create({
      data: {
        userId,
        commentId: id,
        content,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    // Notify comment author
    if (comment.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: comment.userId,
          title: "Reply to Comment",
          message: `${req.user!.username} replied to your comment.`,
        },
      });
    }

    res.status(201).json({
      status: "success",
      reply,
    });
  } catch (error) {
    next(error);
  }
};

export const reportReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { reason } = await CreateReportSchema.parseAsync(req.body);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundError(`Review with ID ${id} not found`);
    }

    const report = await prisma.report.create({
      data: {
        userId,
        reviewId: id,
        reason,
        status: "PENDING",
      },
    });

    res.status(201).json({
      status: "success",
      message: "Review reported successfully. Administrators will review it shortly.",
      report,
    });
  } catch (error) {
    next(error);
  }
};
