import { z } from "zod";

// --- Auth Schemas ---
export const RegisterSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9_@]+$/, "Username can only contain alphanumeric characters, underscores, and @"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  captchaAnswer: z.number().optional(), // In case captcha is active
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

// --- Book Schemas ---
export const CreateBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional().or(z.literal("")),
  pages: z.number().int().positive("Pages must be a positive integer").optional(),
  publishedYear: z.string().optional(),
  isbn: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  pdfUrl: z.string().url("Invalid PDF URL").optional().or(z.literal("")),
  hindiPdfUrl: z.string().url("Invalid Hindi PDF URL").optional().or(z.literal("")),
  contentPreview: z.string().optional(),
  language: z.string().optional(),
  authors: z.array(z.string()).min(1, "At least one author is required"),
  categories: z.array(z.string()).min(1, "At least one category is required"),
});

// --- Review Schemas ---
export const CreateReviewSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  title: z.string().max(100, "Title must not exceed 100 characters").optional(),
  content: z.string().min(10, "Review must be at least 10 characters"),
  ratingValue: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  vibe: z.enum(["positive", "critical", "mixed", "neutral"]).optional(),
  sticker: z.string().optional().nullable(),
});

export const EditReviewSchema = z.object({
  title: z.string().max(100, "Title must not exceed 100 characters").optional(),
  content: z.string().min(10, "Review must be at least 10 characters").optional(),
  ratingValue: z.number().int().min(1).max(5, "Rating must be between 1 and 5").optional(),
  vibe: z.enum(["positive", "critical", "mixed", "neutral"]).optional(),
  sticker: z.string().optional().nullable(),
});

// --- Library/Reading Progress Schemas ---
export const AddToLibrarySchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  status: z.enum(["READING", "COMPLETED", "PLAN_TO_READ", "ON_HOLD", "DROPPED"]),
  pagesRead: z.number().int().nonnegative().default(0),
});

export const UpdateProgressSchema = z.object({
  status: z.enum(["READING", "COMPLETED", "PLAN_TO_READ", "ON_HOLD", "DROPPED"]).optional(),
  pagesRead: z.number().int().nonnegative().optional(),
});

// --- Comment & Reply Schemas ---
export const CreateCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty").max(500, "Comment cannot exceed 500 characters"),
});

export const CreateReportSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200, "Reason must not exceed 200 characters"),
});

// --- TypeScript Types inferred from Schemas ---
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type CreateBookInput = z.infer<typeof CreateBookSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type EditReviewInput = z.infer<typeof EditReviewSchema>;
export type AddToLibraryInput = z.infer<typeof AddToLibrarySchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
