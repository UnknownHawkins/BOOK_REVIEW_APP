import { Request, Response, NextFunction } from "express";
import { CreateBookSchema } from "@bookhub/shared";
import { prisma } from "../config/db";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { logger } from "../config/logger";

export const getBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      genre = "",
      author = "",
      sortBy = "title",
      order = "asc",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query filters
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
        { authors: { some: { name: { contains: search as string } } } },
      ];
    }

    if (genre) {
      where.categories = {
        some: {
          name: { contains: genre as string }
        }
      };
    }

    if (author) {
      where.authors = {
        some: {
          name: { contains: author as string }
        }
      };
    }

    // Sorting
    let orderBy: any = {};
    if (sortBy === "rating") {
      orderBy = { averageRating: order };
    } else if (sortBy === "title") {
      orderBy = { title: order };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: order };
    } else {
      orderBy = { title: "asc" };
    }

    // Execute query
    const [books, total] = await prisma.$transaction([
      prisma.book.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          authors: true,
          categories: true,
        },
      }),
      prisma.book.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      books,
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

export const getBookById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        authors: true,
        categories: true,
        digitalBook: {
          select: {
            id: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            likes: true,
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundError(`Book with ID ${id} not found`);
    }

    // Calculate detailed review statistics (vibes count, star rating breakout)
    const totalReviews = book.reviews.length;
    const vibesCount = {
      positive: 0,
      critical: 0,
      mixed: 0,
      neutral: 0,
    };

    const ratingBreakdown = {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0,
    };

    book.reviews.forEach((review) => {
      // Vibes
      if (review.vibe && review.vibe in vibesCount) {
        vibesCount[review.vibe as keyof typeof vibesCount]++;
      }

      // Ratings
      const r = review.ratingValue.toString();
      if (r in ratingBreakdown) {
        ratingBreakdown[r as keyof typeof ratingBreakdown]++;
      }
    });

    res.status(200).json({
      status: "success",
      book: {
        ...book,
        stats: {
          totalReviews,
          vibesCount,
          ratingBreakdown,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await CreateBookSchema.parseAsync(req.body);

    // Check if authors exist or create them
    const authorIds = [];
    for (const name of validatedData.authors) {
      const author = await prisma.author.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      authorIds.push({ id: author.id });
    }

    // Check if categories exist or create them
    const categoryIds = [];
    for (const catName of validatedData.categories) {
      const category = await prisma.category.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName },
      });
      categoryIds.push({ id: category.id });
    }

    // Create book
    const book = await prisma.book.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        thumbnail: validatedData.thumbnail,
        pages: validatedData.pages,
        publishedYear: validatedData.publishedYear,
        isbn: validatedData.isbn,
        color: validatedData.color,
        pdfUrl: validatedData.pdfUrl,
        hindiPdfUrl: validatedData.hindiPdfUrl,
        contentPreview: validatedData.contentPreview,
        language: validatedData.language,
        authors: {
          connect: authorIds,
        },
        categories: {
          connect: categoryIds,
        },
      },
      include: {
        authors: true,
        categories: true,
      },
    });

    res.status(201).json({
      status: "success",
      book,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Trending defined as books with most reviews / high rating, or flagged as trending.
    // For simplicity: order by average rating and number of reviews
    const books = await prisma.book.findMany({
      take: 6,
      orderBy: [
        { averageRating: "desc" },
      ],
      include: {
        authors: true,
        categories: true,
        _count: {
          select: { reviews: true },
        },
      },
    });

    res.status(200).json({
      status: "success",
      books,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    let books: any[] = [];

    if (userId) {
      // Find books matching categories the user has in reading history or liked reviews
      const userCategories = await prisma.category.findMany({
        where: {
          books: {
            some: {
              readingHistory: {
                some: { userId },
              },
            },
          },
        },
        select: { id: true },
      });

      const catIds = userCategories.map((c) => c.id);

      if (catIds.length > 0) {
        books = await prisma.book.findMany({
          where: {
            categories: {
              some: {
                id: { in: catIds },
              },
            },
            NOT: {
              readingHistory: {
                some: { userId },
              },
            },
          },
          take: 6,
          include: {
            authors: true,
            categories: true,
          },
        });
      }
    }

    // Fallback if no personalized recommendations can be made
    if (books.length === 0) {
      books = await prisma.book.findMany({
        take: 6,
        orderBy: { averageRating: "desc" },
        include: {
          authors: true,
          categories: true,
        },
      });
    }

    res.status(200).json({
      status: "success",
      books,
    });
  } catch (error) {
    next(error);
  }
};
