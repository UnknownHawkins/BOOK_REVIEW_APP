import bcrypt from "bcrypt";
import { prisma } from "./db";
import { logger } from "./logger";

export const seedDatabase = async () => {
  try {
    logger.info("Checking database seeding status...");

    // 1. Seed Admin User
    const adminCount = await prisma.user.count({
      where: { role: "admin" },
    });

    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash("QWERTY@123", 10);
      await prisma.user.create({
        data: {
          username: "Anonymous@",
          email: "anonymous@bookhub.com",
          passwordHash,
          role: "admin",
          avatar: "A",
        },
      });
      logger.info("Admin user created: Anonymous@ / anonymous@bookhub.com / QWERTY@123");
    }

    // 2. Seed Books
    const bookCount = await prisma.book.count();
    if (bookCount === 0) {
      const booksData = [
        {
          title: "The Ramayana",
          authorName: "Valmiki",
          thumbnail: "https://i.pinimg.com/736x/66/dd/c4/66ddc40d895208649668f74df692de0e.jpg",
          pdfUrl: "https://ebooks.tirumala.org/downloads/valmiki_ramayanam.pdf",
          hindiPdfUrl: "https://embassyofindiabangkok.gov.in/public/assets/pdf/Valmiki%20Ramayana%20aur%20Ramakien%20Ek%20Tulnamatmak%20Adhyayan.pdf",
          pages: 500,
          publishedYear: "500 BCE",
          language: "Sanskrit",
          description: "The Ramayana is an ancient Indian epic which narrates the struggle of the divine prince Rama to rescue his wife Sita from the demon king Ravana.",
          contentPreview: "In the beginning, there was the kingdom of Ayodhya, ruled by the wise King Dasharatha...",
          averageRating: 4.8,
          color: "#3b82f6",
          categories: ["Indian", "Epic", "Classic"],
        },
        {
          title: "The Mahabharata",
          authorName: "Vyasa",
          thumbnail: "https://i.pinimg.com/1200x/a1/77/3d/a1773d6d0798ec7a2f938e3cf19885ea.jpg",
          pdfUrl: "https://ebooks.tirumala.org/downloads/the_mahabharata.pdf",
          hindiPdfUrl: "https://ncert.nic.in/textbook/pdf/ghmb101.pdf",
          pages: 1200,
          publishedYear: "400 BCE",
          language: "Sanskrit, Hindi",
          description: "The Mahabharata is one of the two major Sanskrit epics of ancient India, detailing the legendary Kurukshetra War fought between the Pandavas and the Kauravas.",
          contentPreview: "The epic begins with King Shantanu of Hastinapura, who falls in love with the river goddess Ganga...",
          averageRating: 4.8,
          color: "#10b981",
          categories: ["Indian", "Epic", "Classic"],
        },
        {
          title: "To Kill a Mockingbird",
          authorName: "Harper Lee",
          thumbnail: "https://i.pinimg.com/736x/6f/2d/5c/6f2d5c0ffb39d41a54cf4cb0e8517778.jpg",
          pdfUrl: "https://www.raio.org/TKMFullText.pdf",
          pages: 281,
          publishedYear: "1960",
          language: "English",
          description: "A gripping, heart-wrenching tale of race and identity in the American South during the 1930s.",
          contentPreview: "When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow...",
          averageRating: 4.7,
          color: "#8b5cf6",
          categories: ["Classic", "Fiction"],
        },
        {
          title: "The Great Gatsby",
          authorName: "F. Scott Fitzgerald",
          thumbnail: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
          pages: 218,
          publishedYear: "1925",
          language: "English",
          description: "A classic novel of the Jazz Age, exploring themes of idealism, resistance to change, social upheaval, and excess.",
          averageRating: 4.5,
          color: "#3b82f6",
          categories: ["Classic", "Fiction"],
        },
        {
          title: "1984",
          authorName: "George Orwell",
          thumbnail: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop",
          pages: 328,
          publishedYear: "1949",
          language: "English",
          description: "A dystopian social science fiction novel that examines the consequences of totalitarianism.",
          averageRating: 4.7,
          color: "#8b5cf6",
          categories: ["Dystopian", "Fiction"],
        },
        {
          title: "Pride and Prejudice",
          authorName: "Jane Austen",
          thumbnail: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
          pages: 432,
          publishedYear: "1813",
          language: "English",
          description: "A romantic novel of manners that depicts the emotional development of protagonist Elizabeth Bennet.",
          averageRating: 4.6,
          color: "#f97316",
          categories: ["Romance", "Classic"],
        },
      ];

      for (const item of booksData) {
        // Find or create author
        const author = await prisma.author.upsert({
          where: { name: item.authorName },
          update: {},
          create: { name: item.authorName },
        });

        // Find or create categories
        const categoryIds = [];
        for (const catName of item.categories) {
          const category = await prisma.category.upsert({
            where: { name: catName },
            update: {},
            create: { name: catName },
          });
          categoryIds.push({ id: category.id });
        }

        // Create book
        await prisma.book.create({
          data: {
            title: item.title,
            thumbnail: item.thumbnail,
            pdfUrl: item.pdfUrl,
            hindiPdfUrl: item.hindiPdfUrl,
            pages: item.pages,
            publishedYear: item.publishedYear,
            language: item.language,
            description: item.description,
            contentPreview: item.contentPreview,
            averageRating: item.averageRating,
            color: item.color,
            authors: {
              connect: [{ id: author.id }],
            },
            categories: {
              connect: categoryIds,
            },
          },
        });
      }

      logger.info("Default sample books seeded successfully!");
    } else {
      logger.info("Books already exist in the database. Skipping seed.");
    }
  } catch (error) {
    logger.error("Seeding failed: " + (error as Error).message);
  }
};
