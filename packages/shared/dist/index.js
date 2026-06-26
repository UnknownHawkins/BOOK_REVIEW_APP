"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReportSchema = exports.CreateCommentSchema = exports.UpdateProgressSchema = exports.AddToLibrarySchema = exports.EditReviewSchema = exports.CreateReviewSchema = exports.CreateBookSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
// --- Auth Schemas ---
exports.RegisterSchema = zod_1.z.object({
    username: zod_1.z.string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must not exceed 30 characters")
        .regex(/^[a-zA-Z0-9_@]+$/, "Username can only contain alphanumeric characters, underscores, and @"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
    captchaAnswer: zod_1.z.number().optional(), // In case captcha is active
});
exports.ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
    password: zod_1.z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});
// --- Book Schemas ---
exports.CreateBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().optional(),
    thumbnail: zod_1.z.string().url("Invalid thumbnail URL").optional().or(zod_1.z.literal("")),
    pages: zod_1.z.number().int().positive("Pages must be a positive integer").optional(),
    publishedYear: zod_1.z.string().optional(),
    isbn: zod_1.z.string().optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
    pdfUrl: zod_1.z.string().url("Invalid PDF URL").optional().or(zod_1.z.literal("")),
    hindiPdfUrl: zod_1.z.string().url("Invalid Hindi PDF URL").optional().or(zod_1.z.literal("")),
    contentPreview: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    authors: zod_1.z.array(zod_1.z.string()).min(1, "At least one author is required"),
    categories: zod_1.z.array(zod_1.z.string()).min(1, "At least one category is required"),
});
// --- Review Schemas ---
exports.CreateReviewSchema = zod_1.z.object({
    bookId: zod_1.z.string().min(1, "Book ID is required"),
    title: zod_1.z.string().max(100, "Title must not exceed 100 characters").optional(),
    content: zod_1.z.string().min(10, "Review must be at least 10 characters"),
    ratingValue: zod_1.z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
    vibe: zod_1.z.enum(["positive", "critical", "mixed", "neutral"]).optional(),
    sticker: zod_1.z.string().optional().nullable(),
});
exports.EditReviewSchema = zod_1.z.object({
    title: zod_1.z.string().max(100, "Title must not exceed 100 characters").optional(),
    content: zod_1.z.string().min(10, "Review must be at least 10 characters").optional(),
    ratingValue: zod_1.z.number().int().min(1).max(5, "Rating must be between 1 and 5").optional(),
    vibe: zod_1.z.enum(["positive", "critical", "mixed", "neutral"]).optional(),
    sticker: zod_1.z.string().optional().nullable(),
});
// --- Library/Reading Progress Schemas ---
exports.AddToLibrarySchema = zod_1.z.object({
    bookId: zod_1.z.string().min(1, "Book ID is required"),
    status: zod_1.z.enum(["READING", "COMPLETED", "PLAN_TO_READ", "ON_HOLD", "DROPPED"]),
    pagesRead: zod_1.z.number().int().nonnegative().default(0),
});
exports.UpdateProgressSchema = zod_1.z.object({
    status: zod_1.z.enum(["READING", "COMPLETED", "PLAN_TO_READ", "ON_HOLD", "DROPPED"]).optional(),
    pagesRead: zod_1.z.number().int().nonnegative().optional(),
});
// --- Comment & Reply Schemas ---
exports.CreateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Comment content cannot be empty").max(500, "Comment cannot exceed 500 characters"),
});
exports.CreateReportSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5, "Reason must be at least 5 characters").max(200, "Reason must not exceed 200 characters"),
});
