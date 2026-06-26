import { Request, Response, NextFunction } from "express";
import { ai } from "../config/gemini";
import { prisma } from "../config/db";
import { logger } from "../config/logger";

export const recommendBooksAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { genres = [], preferredVibe = "", currentBookTitle = "" } = req.body;

    if (!ai) {
      // Mock Fallback when Gemini API key is missing
      logger.info("Gemini client not initialized. Using fallback recommendations.");
      const fallbackBooks = await prisma.book.findMany({
        take: 3,
        orderBy: { averageRating: "desc" },
        include: { authors: true },
      });

      return res.status(200).json({
        status: "success",
        source: "local_database_fallback",
        recommendations: fallbackBooks.map((b) => ({
          title: b.title,
          author: b.authors[0]?.name || "Unknown Author",
          reason: `Highly rated book in our collection matching your interest in ${genres.join(", ") || "General Reading"}.`,
        })),
      });
    }

    const prompt = `
      You are a literary assistant for BookHub, a book review and tracking app.
      A user is asking for book recommendations. Here is their context:
      - Preferred genres/categories: ${genres.join(", ") || "Any"}
      - Preferred vibe/style: ${preferredVibe || "None specified"}
      - Currently reading/enjoyed: ${currentBookTitle || "None specified"}

      Suggest exactly 3 real books. For each book, provide:
      1. Title
      2. Author
      3. A short, compelling 2-sentence reason explaining why they would enjoy it based on their preferences.

      Format your output strictly as a JSON array like this:
      [
        {
          "title": "Book Title 1",
          "author": "Author Name 1",
          "reason": "Reason why they would enjoy this book..."
        },
        ...
      ]
      Do not include any markdown formatting wrappers (like \`\`\`json) or extra text. Just return the raw JSON array.
    `;

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Clean JSON response (strip markdown wrappers if model output contains them)
    const cleanedText = text
      .replace(/^```json/i, "")
      .replace(/```$/, "")
      .trim();

    const recommendations = JSON.parse(cleanedText);

    res.status(200).json({
      status: "success",
      source: "gemini_ai",
      recommendations,
    });
  } catch (error) {
    logger.error("AI recommendation error: " + (error as Error).message);
    // Silent fallback to avoid crashing frontend
    try {
      const fallbackBooks = await prisma.book.findMany({
        take: 3,
        orderBy: { averageRating: "desc" },
        include: { authors: true },
      });
      res.status(200).json({
        status: "success",
        source: "local_database_fallback",
        recommendations: fallbackBooks.map((b) => ({
          title: b.title,
          author: b.authors[0]?.name || "Unknown Author",
          reason: "Selected from our top-rated shelf.",
        })),
      });
    } catch (fallbackError) {
      next(error);
    }
  }
};

export const summarizeReviewsAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ status: "error", message: "bookId is required" });
    }

    const reviews = await prisma.review.findMany({
      where: { bookId },
      select: { content: true, ratingValue: true },
      take: 10,
    });

    if (reviews.length === 0) {
      return res.status(200).json({
        status: "success",
        summary: "No reviews exist for this book yet. Write one to help others!",
      });
    }

    if (!ai) {
      // Mock Fallback when Gemini API key is missing
      const averageRating = (reviews.reduce((sum, r) => sum + r.ratingValue, 0) / reviews.length).toFixed(1);
      return res.status(200).json({
        status: "success",
        source: "local_database_fallback",
        summary: `Based on ${reviews.length} reviews, this book has a consensus rating of ${averageRating}/5 stars. Readers highlight various parts of the story, generally reflecting standard user feedback.`,
      });
    }

    const reviewsText = reviews.map((r) => `- [Rating: ${r.ratingValue}/5]: "${r.content}"`).join("\n");

    const prompt = `
      You are an expert review summarizer for BookHub.
      Below is a list of reviews written by readers for a specific book.
      Analyze these reviews and provide a concise, balanced summary (under 120 words) detailing:
      1. What readers generally like about the book.
      2. Any common criticisms or mixed opinions.
      
      Here are the reviews:
      ${reviewsText}
      
      Write the summary in a professional, engaging tone. Do not use bullet points or lists; write as a single paragraph.
    `;

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    res.status(200).json({
      status: "success",
      source: "gemini_ai",
      summary,
    });
  } catch (error) {
    logger.error("AI summarization error: " + (error as Error).message);
    res.status(200).json({
      status: "success",
      source: "error_fallback",
      summary: "Could not generate AI review summary at this time.",
    });
  }
};
