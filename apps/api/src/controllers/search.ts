import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { prisma } from "../config/db";
import { logger } from "../config/logger";

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const DEFAULT_GOOGLE_API_KEY = "AIzaSyCpqKevtXzm-SuF62BqwQztTvFRB2g3Cd4"; // Fallback from original source

// Simple in-memory cache for search queries
const searchCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const searchBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q = "" } = req.query;
    const query = (q as string).trim();

    if (!query) {
      return res.status(200).json({ status: "success", localBooks: [], externalBooks: [] });
    }

    // 1. Local Search (Prisma)
    const localBooks = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { authors: { some: { name: { contains: query } } } },
        ],
      },
      include: {
        authors: true,
        categories: true,
      },
      take: 10,
    });

    // 2. Google Books Search (External) with Caching
    let externalBooks: any[] = [];
    const cacheKey = `gbooks_${query.toLowerCase()}`;
    const cached = searchCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      externalBooks = cached.data;
      logger.info(`Search cache hit for: ${query}`);
    } else {
      try {
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY || DEFAULT_GOOGLE_API_KEY;
        const response = await axios.get(GOOGLE_BOOKS_BASE_URL, {
          params: {
            q: query,
            key: apiKey,
            maxResults: 10,
          },
        });

        if (response.data.items) {
          externalBooks = response.data.items.map((item: any) => {
            const info = item.volumeInfo;
            return {
              id: item.id,
              title: info.title,
              authors: info.authors || ["Unknown Author"],
              thumbnail: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null,
              description: info.description || null,
              pages: info.pageCount || null,
              publishedYear: info.publishedDate ? info.publishedDate.split("-")[0] : null,
              categories: info.categories || ["General"],
              averageRating: info.averageRating || 0.0,
            };
          });
        }

        // Cache the result
        searchCache.set(cacheKey, {
          data: externalBooks,
          expiry: Date.now() + CACHE_TTL,
        });
      } catch (err) {
        logger.error("Google Books API query failed: " + (err as Error).message);
        // Continue and return local results only instead of failing the whole request
      }
    }

    res.status(200).json({
      status: "success",
      localBooks,
      externalBooks,
    });
  } catch (error) {
    next(error);
  }
};
