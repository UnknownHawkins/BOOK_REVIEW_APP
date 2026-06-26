import { z } from "zod";
export declare const RegisterSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
}, {
    username: string;
    email: string;
    password: string;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    captchaAnswer: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    captchaAnswer?: number | undefined;
}, {
    email: string;
    password: string;
    captchaAnswer?: number | undefined;
}>;
export declare const ForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const ResetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const CreateBookSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    pages: z.ZodOptional<z.ZodNumber>;
    publishedYear: z.ZodOptional<z.ZodString>;
    isbn: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    pdfUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    hindiPdfUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    contentPreview: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    authors: z.ZodArray<z.ZodString, "many">;
    categories: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    title: string;
    authors: string[];
    categories: string[];
    description?: string | undefined;
    thumbnail?: string | undefined;
    pages?: number | undefined;
    publishedYear?: string | undefined;
    isbn?: string | undefined;
    color?: string | undefined;
    pdfUrl?: string | undefined;
    hindiPdfUrl?: string | undefined;
    contentPreview?: string | undefined;
    language?: string | undefined;
}, {
    title: string;
    authors: string[];
    categories: string[];
    description?: string | undefined;
    thumbnail?: string | undefined;
    pages?: number | undefined;
    publishedYear?: string | undefined;
    isbn?: string | undefined;
    color?: string | undefined;
    pdfUrl?: string | undefined;
    hindiPdfUrl?: string | undefined;
    contentPreview?: string | undefined;
    language?: string | undefined;
}>;
export declare const CreateReviewSchema: z.ZodObject<{
    bookId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    ratingValue: z.ZodNumber;
    vibe: z.ZodOptional<z.ZodEnum<["positive", "critical", "mixed", "neutral"]>>;
    sticker: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    bookId: string;
    content: string;
    ratingValue: number;
    title?: string | undefined;
    vibe?: "positive" | "critical" | "mixed" | "neutral" | undefined;
    sticker?: string | null | undefined;
}, {
    bookId: string;
    content: string;
    ratingValue: number;
    title?: string | undefined;
    vibe?: "positive" | "critical" | "mixed" | "neutral" | undefined;
    sticker?: string | null | undefined;
}>;
export declare const EditReviewSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    ratingValue: z.ZodOptional<z.ZodNumber>;
    vibe: z.ZodOptional<z.ZodEnum<["positive", "critical", "mixed", "neutral"]>>;
    sticker: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    content?: string | undefined;
    ratingValue?: number | undefined;
    vibe?: "positive" | "critical" | "mixed" | "neutral" | undefined;
    sticker?: string | null | undefined;
}, {
    title?: string | undefined;
    content?: string | undefined;
    ratingValue?: number | undefined;
    vibe?: "positive" | "critical" | "mixed" | "neutral" | undefined;
    sticker?: string | null | undefined;
}>;
export declare const AddToLibrarySchema: z.ZodObject<{
    bookId: z.ZodString;
    status: z.ZodEnum<["READING", "COMPLETED", "PLAN_TO_READ", "ON_HOLD", "DROPPED"]>;
    pagesRead: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED";
    bookId: string;
    pagesRead: number;
}, {
    status: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED";
    bookId: string;
    pagesRead?: number | undefined;
}>;
export declare const UpdateProgressSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["READING", "COMPLETED", "PLAN_TO_READ", "ON_HOLD", "DROPPED"]>>;
    pagesRead: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED" | undefined;
    pagesRead?: number | undefined;
}, {
    status?: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED" | undefined;
    pagesRead?: number | undefined;
}>;
export declare const CreateCommentSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const CreateReportSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
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
