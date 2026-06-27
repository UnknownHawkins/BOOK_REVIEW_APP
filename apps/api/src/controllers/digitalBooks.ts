import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { ai, apiKey } from "../config/gemini";
import { NotFoundError } from "../utils/errors";
import { logger } from "../config/logger";

const createMockDigitalBook = async (bookId: string, bookTitle: string, authorNames: string) => {
  const mockChaptersData = [
    {
      chapterNumber: 1,
      title: "Introduction & Historical Context",
      content: `Welcome to the digital reader companion for "${bookTitle}" by ${authorNames}. This classic literary work explores deep themes and narratives. In this introductory chapter, we examine the context in which the author wrote the book, the core premises of the plot, and the overarching messages that have made this work endure through time. Readers are introduced to the major conflicts and historical background that shape the characters' decisions throughout the text. By understanding the historical context, we can better appreciate the challenges faced by the characters and the symbolism embedded in the narrative.`,
    },
    {
      chapterNumber: 2,
      title: "Characters, Perspectives & Motivations",
      content: `This chapter delves into the primary characters of "${bookTitle}". We analyze their relationships, internal struggles, and what drives them forward in the narrative. By examining key dialogues and interactions, we uncover the moral dilemmas faced by each character and how their decisions represent larger societal themes. The complexity of these figures is what gives this book its emotional depth and intellectual resonance, and allows readers to empathize with their trials.`,
    },
    {
      chapterNumber: 3,
      title: "Key Narratives & Crucial Turning Points",
      content: `Every great book has its turning points, and "${bookTitle}" is no exception. In this section, we trace the rising action and the pivotal scenes that shift the momentum of the story. Whether it is a betrayal, a discovery, or an internal realization, these moments challenge the characters and force them to adapt. We break down the narrative structure and highlight the literary techniques used by ${authorNames} to build tension and captivate the audience.`,
    },
    {
      chapterNumber: 4,
      title: "Philosophical Themes & Literary Symbolism",
      content: `Underneath the surface story of "${bookTitle}" lies a rich tapestry of symbols and philosophical inquiries. Here, we analyze the deeper meanings behind the motifs, settings, and recurring objects in the book. From ethical questions to existential contemplation, ${authorNames} invites readers to reflect on human nature, justice, and the consequences of our choices. This chapter provides the tools to fully decode the text's symbols and appreciate its artistic nuances.`,
    },
    {
      chapterNumber: 5,
      title: "Resolution & The Enduring Legacy",
      content: `In this final chapter, we discuss the resolution of the plot in "${bookTitle}" and the lingering questions it leaves behind. We summarize the lasting legacy of the work, how it has influenced subsequent literature, and why it continues to be discussed and analyzed by readers worldwide. We conclude with final reflections on the book's message and how its timeless insights can be applied to our modern lives.`,
    },
  ];

  return await prisma.digitalBook.create({
    data: {
      bookId,
      chapters: {
        create: mockChaptersData,
      },
    },
    include: {
      chapters: {
        orderBy: { chapterNumber: "asc" },
      },
    },
  });
};

export const getOrCreateDigitalBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // bookId

    // 1. Verify book exists
    const book = await prisma.book.findUnique({
      where: { id },
      include: { authors: true },
    });

    if (!book) {
      throw new NotFoundError(`Book with ID ${id} not found`);
    }

    // 2. Check if DigitalBook already exists
    const existingDigitalBook = await prisma.digitalBook.findUnique({
      where: { bookId: id },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
        },
      },
    });

    if (existingDigitalBook) {
      return res.status(200).json({
        status: "success",
        source: "database_cache",
        digitalBook: existingDigitalBook,
      });
    }

    const authorNames = book.authors.map((a) => a.name).join(", ") || "Unknown Author";

    // 3. If DeepSeek is not configured, generate fallback mock chapters
    if (!ai || !apiKey) {
      logger.warn(`DeepSeek AI is not configured. Creating mock digital book for: "${book.title}"`);
      const newDigitalBook = await createMockDigitalBook(id, book.title, authorNames);

      return res.status(201).json({
        status: "success",
        source: "mock_fallback",
        digitalBook: newDigitalBook,
      });
    }

    // 4. Generate with DeepSeek AI
    try {
      logger.info(`Generating AI Digital Book for: "${book.title}"`);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are an expert digital librarian and academic literary scholar.
        Generate a highly detailed, comprehensive, and complete digital book reading version for the book titled "${book.title}" by author "${authorNames}".
        Since the original text might be copyrighted, you must generate a highly comprehensive, paragraph-by-paragraph, word-for-word style complete reading narrative of the book's content.
        It should NOT be a simple summary. It must be a complete, fully fleshed-out readable text, written in a paragraph-by-paragraph, highly detailed style that mirrors the full book's events, dialogues, character monologues, descriptions, and depth.
        Provide maximum details for each chapter.
        
        Generate exactly 5 chapters. Each chapter must contain:
        1. chapterNumber: number (1, 2, 3, 4, 5)
        2. title: a specific, descriptive chapter title
        3. content: an extremely long, fully detailed, and comprehensive readable text (at least 1500-2000 words per chapter) containing the full storyline, paragraph-by-paragraph narrative details, character actions, full dialogues, and key scenes in maximum depth. Format with standard paragraphs and proper spacing.

        Format your output strictly as a JSON object like this:
        {
          "chapters": [
            {
              "chapterNumber": 1,
              "title": "...",
              "content": "..."
            },
            ...
          ]
        }
        Do not include any markdown formatting wrappers (like \`\`\`json) or extra text. Just return the raw JSON object.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Clean JSON response
      const cleanedText = responseText
        .replace(/^```json/i, "")
        .replace(/```$/, "")
        .trim();

      const parsedData = JSON.parse(cleanedText);

      if (!parsedData.chapters || !Array.isArray(parsedData.chapters)) {
        throw new Error("Invalid output format from DeepSeek API");
      }

      // Create record in DB
      const newDigitalBook = await prisma.digitalBook.create({
        data: {
          bookId: id,
          chapters: {
            create: parsedData.chapters.map((ch: any) => ({
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              content: ch.content,
            })),
          },
        },
        include: {
          chapters: {
            orderBy: { chapterNumber: "asc" },
          },
        },
      });

      return res.status(201).json({
        status: "success",
        source: "deepseek_ai",
        digitalBook: newDigitalBook,
      });
    } catch (aiError: any) {
      logger.error(`DeepSeek API generation failed: ${aiError.message}. Falling back to mock chapter generation.`);
      const newDigitalBook = await createMockDigitalBook(id, book.title, authorNames);

      return res.status(201).json({
        status: "success",
        source: "mock_fallback",
        digitalBook: newDigitalBook,
      });
    }

  } catch (error) {
    logger.error("Digital Book controller error: " + (error as Error).message);
    next(error);
  }
};

