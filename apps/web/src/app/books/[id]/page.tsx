"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/utils/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import {
  Star,
  BookOpen,
  FileText,
  Sparkles,
  Heart,
  Bookmark,
  Plus,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Globe,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Type,
  Loader2,
  Smile,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STICKERS = [
  { emoji: "🌟", label: "Masterpiece", value: "masterpiece" },
  { emoji: "🔥", label: "Mind Blowing", value: "mind_blowing" },
  { emoji: "❤️", label: "Love It", value: "love_it" },
  { emoji: "😢", label: "Emotional", value: "emotional" },
  { emoji: "🥱", label: "Boring", value: "boring" },
  { emoji: "🧠", label: "Thought Provoking", value: "thought_provoking" },
  { emoji: "⚡", label: "Thrilling", value: "thrilling" },
  { emoji: "💡", label: "Insightful", value: "insightful" }
];

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  // Component states
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewVibe, setReviewVibe] = useState<"positive" | "critical" | "mixed" | "neutral">("neutral");
  const [reviewSticker, setReviewSticker] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Digital Book reader states
  const [digitalBook, setDigitalBook] = useState<any>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [generatingBook, setGeneratingBook] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [readerFont, setReaderFont] = useState<"serif" | "sans">("serif");
  const [readerSize, setReaderSize] = useState<"sm" | "md" | "lg">("md");
  const [readerTheme, setReaderTheme] = useState<"light" | "dark" | "sepia">("sepia");

  // Comments state maps
  const [commentInputs, setCommentInputs] = useState<{ [reviewId: string]: string }>({});

  // 1. Fetch Book Details
  const { data: bookRes, isLoading: bookLoading, error } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const res = await api.get(`/books/${bookId}`);
      return res.data;
    },
  });

  // 2. Fetch User Library Status (only if authenticated)
  const { data: libraryRes } = useQuery({
    queryKey: ["userLibraryStatus", bookId],
    queryFn: async () => {
      const res = await api.get("/users/me/library");
      return res.data.library.find((l: any) => l.bookId === bookId) || null;
    },
    enabled: isAuthenticated,
  });

  const libraryEntry = libraryRes || null;

  // 3. Mutate: Add to Library / Update Progress
  const libraryMutation = useMutation({
    mutationFn: async (data: { status: string; pagesRead: number }) => {
      const res = await api.post("/users/me/library", {
        bookId,
        status: data.status,
        pagesRead: data.pagesRead,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLibraryStatus", bookId] });
      toast.success("Reading status updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  // 4. Mutate: Write Review
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/reviews", {
        bookId,
        title: reviewTitle,
        content: reviewContent,
        ratingValue: reviewRating,
        vibe: reviewVibe,
        sticker: reviewSticker,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      toast.success("Review posted successfully!");
      // Reset form
      setReviewTitle("");
      setReviewContent("");
      setReviewRating(5);
      setReviewVibe("neutral");
      setReviewSticker(null);
      setShowReviewForm(false);
    },
    onError: (err: any) => {
      const backendMsg = err.response?.data?.message;
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors) && errors.length > 0) {
        toast.error(errors[0].message);
      } else {
        toast.error(backendMsg || "Could not save review");
      }
    },
  });

  const handlePostReview = () => {
    if (reviewContent.trim().length < 10) {
      toast.error("Review details must be at least 10 characters");
      return;
    }
    reviewMutation.mutate();
  };

  // 5. Mutate: Like Review
  const likeMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await api.post(`/reviews/${reviewId}/like`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
    },
  });

  // 6. Mutate: Add Comment
  const commentMutation = useMutation({
    mutationFn: async ({ reviewId, content }: { reviewId: string; content: string }) => {
      const res = await api.post(`/reviews/${reviewId}/comments`, { content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      toast.success("Comment added!");
    },
  });

  // 7. Mutate: Report Review
  const reportMutation = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      const res = await api.post(`/reviews/${reviewId}/report`, { reason });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Review has been reported to administrators.");
    },
  });

  // 8. Call Gemini AI Summarize
  const handleAiSummarize = async () => {
    setAiLoading(true);
    setAiSummary("");
    try {
      const res = await api.post("/ai/summarize", { bookId });
      setAiSummary(res.data.summary);
    } catch (err) {
      toast.error("Could not generate review summary.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleLibraryStatusChange = (status: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to log reading progress");
      return;
    }
    const pages = status === "COMPLETED" ? book?.pages || 0 : libraryEntry?.pagesRead || 0;
    libraryMutation.mutate({ status, pagesRead: pages });
  };

  const handlePagesReadChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const pagesRead = parseInt(data.get("pagesRead") as string, 10);
    const currentStatus = libraryEntry?.status || "READING";

    libraryMutation.mutate({ status: currentStatus, pagesRead });
  };
  const handleGetOrCreateDigitalBook = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to read digital books");
      return;
    }
    setGeneratingBook(true);
    try {
      const res = await api.post(`/books/${bookId}/digital-book`);
      setDigitalBook(res.data.digitalBook);
      setReaderOpen(true);
      toast.success(
        res.data.source === "gemini_ai"
          ? "Digital book generated by Gemini AI!"
          : "Digital book loaded from database cache."
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate digital book.");
    } finally {
      setGeneratingBook(false);
    }
  };
  const handlePostComment = (reviewId: string) => {
    const content = commentInputs[reviewId] || "";
    if (!content.trim()) return;

    if (!isAuthenticated) {
      toast.error("Please login to post comments");
      return;
    }

    commentMutation.mutate({ reviewId, content });
    setCommentInputs({ ...commentInputs, [reviewId]: "" });
  };

  if (bookLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="animate-pulse font-bold text-lg">Loading Book Details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const book = bookRes?.book;
  if (!book) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-xl font-bold">Book Not Found</h2>
          <button onClick={() => router.push("/books")} className="mt-4 text-primary flex items-center gap-1.5 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const userHasReviewed = book.reviews.some((r: any) => r.userId === user?.id);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Back link */}
        <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Book Details Container */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Cover & Library Logging (Col 1) */}
          <div className="space-y-6">
            <div
              className="relative aspect-[2/3] w-full rounded-xl overflow-hidden card-shadow border border-[#edebe9] dark:border-[#2b5148]"
              style={{ backgroundColor: book.color || "#edebe9" }}
            >
              {book.thumbnail ? (
                <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-gray-700 dark:text-gray-200">
                  <BookOpen className="h-16 w-16 text-[#00754A] mb-4" />
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{book.title}</span>
                </div>
              )}
            </div>

            {/* Read progress logger */}
            <div className="bg-white dark:bg-[#1e3932] p-5 rounded-xl card-shadow space-y-4 border border-[#edebe9] dark:border-[#2b5148]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#006241] dark:text-[#cba258]">
                Reading Customization
              </h3>

              {isAuthenticated ? (
                <div className="space-y-4">
                  {/* Status selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Select Status
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Plan to Read", value: "PLAN_TO_READ" },
                        { label: "Reading", value: "READING" },
                        { label: "Completed", value: "COMPLETED" },
                        { label: "On Hold", value: "ON_HOLD" },
                        { label: "Dropped", value: "DROPPED" }
                      ].map((opt) => {
                        const isSelected = (libraryEntry?.status || "PLAN_TO_READ") === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleLibraryStatusChange(opt.value)}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-full border text-center transition-all duration-200 active:scale-95 ${
                              isSelected
                                ? "bg-[#00754A] border-[#00754A] text-white"
                                : "bg-transparent border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pages read input if reading */}
                  {libraryEntry?.status === "READING" && (
                    <form onSubmit={handlePagesReadChange} className="flex gap-2 items-end pt-2 border-t border-[#edebe9] dark:border-[#2b5148]">
                      <div className="flex-1">
                        <label className="block text-xs font-bold mb-1 text-gray-550 dark:text-gray-450 uppercase tracking-wider">Pages Read</label>
                        <input
                          type="number"
                          name="pagesRead"
                          required
                          defaultValue={libraryEntry.pagesRead}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-full bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#00754A] focus:border-transparent"
                          max={book.pages || 9999}
                          min={0}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-primary-filled px-4 py-1.5 text-xs font-bold cursor-pointer"
                      >
                        Update
                      </button>
                    </form>
                  )}

                  {/* Display progress stats */}
                  {libraryEntry && (
                    <div className="pt-3 border-t border-[#edebe9] dark:border-[#2b5148] text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>
                        Current progress:{" "}
                        <span className="font-bold text-gray-800 dark:text-white">
                          {libraryEntry.pagesRead} / {book.pages || "?"} pages
                        </span>
                      </p>
                      {book.pages && (
                        <div className="w-full bg-[#edebe9] dark:bg-[#13221d] h-2 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-[#00754A] h-full transition-all duration-300"
                            style={{ width: `${(libraryEntry.pagesRead / book.pages) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-450 dark:text-gray-400">Login to save this book to your library.</p>
                  <Link href="/auth/login" className="text-xs text-[#00754A] font-bold hover:underline block mt-2">
                    Sign In &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Book Metadata & Synopsis (Col 2-3) */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {book.categories.map((c: any) => (
                  <span
                    key={c.name}
                    className="inline-block text-[9px] font-black uppercase tracking-wider text-[#00754A] dark:text-[#d4e9e2] bg-[#d4e9e2]/40 dark:bg-[#00754A]/30 px-3 py-1 rounded-full border border-[#d4e9e2] dark:border-[#00754A]"
                  >
                    {c.name}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl font-serif-rewards tracking-tight md:text-4xl text-[#006241] dark:text-white font-normal leading-tight">
                {book.title}
              </h1>
              <p className="mt-2 text-sm text-gray-550 dark:text-gray-400">
                by <span className="font-bold text-gray-800 dark:text-white">{book.authors.map((a: any) => a.name).join(", ")}</span>
              </p>
            </div>

            {/* Quick Details Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-[#edebe9] dark:border-[#2b5148] rounded-xl bg-white dark:bg-[#1e3932] card-shadow">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Average Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[#cba258] text-[#cba258]" />
                  <span className="text-sm font-extrabold text-gray-800 dark:text-white">{book.averageRating.toFixed(1)}/5</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Pages Count</span>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-800 dark:text-white">{book.pages || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Published Year</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-800 dark:text-white">{book.publishedYear || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Language</span>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-800 dark:text-white">{book.language || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Read Online/PDF Section or AI Digital Book Reader */}
            {(book.pdfUrl || book.hindiPdfUrl) ? (
              <div className="p-5 border border-[#edebe9] dark:border-[#2b5148] rounded-xl bg-white dark:bg-[#1e3932] card-shadow flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#00754A]/10 text-[#00754A] dark:text-[#d4e9e2]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">Read Online / Download PDF</h4>
                    <p className="text-xs text-gray-400">Access full text PDFs of this classic epic.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {book.pdfUrl && (
                    <a
                      href={book.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary-filled text-xs py-1.5 cursor-pointer"
                    >
                      English Version
                    </a>
                  )}
                  {book.hindiPdfUrl && (
                    <a
                      href={book.hindiPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-dark-outlined text-xs py-1.5 cursor-pointer"
                    >
                      Hindi Version
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 border border-[#edebe9] dark:border-[#2b5148] rounded-xl bg-white dark:bg-[#1e3932] card-shadow flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#00754A]/10 text-[#00754A] dark:text-[#d4e9e2]">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">AI Digital Reader</h4>
                    <p className="text-xs text-gray-405 dark:text-gray-400 max-w-md">
                      {book.digitalBook
                        ? "This book is ready to read in our AI Digital Reader."
                        : "Generate a detailed chapter-by-chapter reading experience using DeepSeek AI."}
                    </p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={handleGetOrCreateDigitalBook}
                    disabled={generatingBook}
                    className="btn-primary-filled text-xs py-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {generatingBook ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Generating...
                      </>
                    ) : book.digitalBook ? (
                      <>
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        Open Digital Book
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Generate & Read
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Book Description */}
            <div className="space-y-2">
              <h3 className="font-bold text-base text-[#006241] dark:text-[#d4e9e2] uppercase tracking-wider">Synopsis</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                {book.description || "No synopsis available for this book."}
              </p>
            </div>

            {/* Gemini Review consensus */}
            <div className="p-5 border border-[#cba258]/30 dark:border-[#cba258]/20 rounded-xl bg-[#faf6ee] dark:bg-[#1e3932] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#006241] dark:text-[#cba258]">
                  <Sparkles className="h-4 w-4" />
                  AI consensus
                </div>
                <button
                  onClick={handleAiSummarize}
                  disabled={aiLoading}
                  className="btn-primary-outlined text-xs py-1 px-3 cursor-pointer"
                >
                  {aiLoading ? "Summarizing..." : "Summarize Reviews"}
                </button>
              </div>

              {aiSummary && (
                <p className="text-xs text-gray-800 dark:text-gray-300 leading-relaxed bg-white/70 dark:bg-black/20 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
                  {aiSummary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-12 border-t border-[#edebe9] dark:border-[#2b5148] pt-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-serif-rewards text-[#006241] dark:text-white font-normal">Community Reviews</h2>
              <p className="text-xs text-gray-500 mt-1">Read honest vibe assessments from readers</p>
            </div>

            {!userHasReviewed && isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn-primary-filled text-sm py-2 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Write Review
              </button>
            )}
          </div>

          {/* Write Review Form */}
          {showReviewForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="border border-[#edebe9] dark:border-[#2b5148] p-6 rounded-xl bg-white dark:bg-[#1e3932] card-shadow mb-8 space-y-4"
            >
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Write your review</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setReviewRating(val)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            val <= reviewRating ? "fill-[#cba258] text-[#cba258]" : "text-gray-300 dark:text-gray-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Assessment Vibe</label>
                  <div className="flex flex-wrap gap-2">
                    {["positive", "neutral", "mixed", "critical"].map((v: any) => {
                      const isSelected = reviewVibe === v;
                      let activeStyle = "bg-[#00754A] border-[#00754A] text-white";
                      if (v === "critical") activeStyle = "bg-red-700 border-red-700 text-white";
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setReviewVibe(v)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize border transition-all active:scale-95 ${
                            isSelected
                              ? activeStyle
                              : "bg-transparent border-gray-300 dark:border-gray-750 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <Smile className="h-3.5 w-3.5 text-[#00754A]" />
                  Select a Sticker Badge (Optional)
                </label>
                <div className="flex flex-wrap gap-2 py-1">
                  {STICKERS.map((s) => {
                    const isSelected = reviewSticker === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setReviewSticker(reviewSticker === s.value ? null : s.value)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${
                          isSelected
                            ? "bg-[#faf6ee] dark:bg-[#1e3932] border-[#cba258] text-[#cba258] shadow-sm scale-105"
                            : "bg-transparent border-[#edebe9] dark:border-[#2b5148] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <span>{s.emoji}</span>
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Review Headline</label>
                  <input
                    type="text"
                    placeholder="Sum up your thoughts in one sentence..."
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#00754A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Review Details</label>
                  <textarea
                    rows={4}
                    placeholder="What did you think of the writing style, characters, plot pacing? Write at least 10 characters."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-300 dark:border-gray-700 rounded-2xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#00754A]"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn-dark-outlined text-sm font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePostReview}
                    disabled={reviewMutation.isPending}
                    className="btn-primary-filled text-sm font-bold cursor-pointer"
                  >
                    Post Review
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reviews List */}
          {book.reviews.length === 0 ? (
            <div className="text-center py-12 border border-[#edebe9] dark:border-[#2b5148] rounded-xl bg-white dark:bg-[#1e3932] card-shadow">
              <MessageSquare className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="font-bold text-gray-600 dark:text-gray-400">No reviews yet</p>
              <p className="text-xs text-gray-450 mt-1">Be the first to review this book!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {book.reviews.map((review: any) => {
                const isLiked = review.likes.some((l: any) => l.userId === user?.id);

                return (
                  <div
                    key={review.id}
                    className="p-5 rounded-xl bg-white dark:bg-[#1e3932] card-shadow border border-[#edebe9] dark:border-[#2b5148] space-y-4"
                  >
                    {/* Review Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#d4e9e2] text-[#00754A] flex items-center justify-center font-bold text-sm">
                          {review.user.avatar || review.user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{review.user.username}</h4>
                            {review.sticker && (
                              (() => {
                                const found = STICKERS.find((s) => s.value === review.sticker);
                                if (!found) return null;
                                return (
                                  <span className="inline-flex items-center gap-1 bg-[#faf6ee] text-[#cba258] border border-[#cba258]/35 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    <span>{found.emoji}</span>
                                    <span>{found.label}</span>
                                  </span>
                                );
                              })()
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {review.vibe && (
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              review.vibe === "positive"
                                ? "bg-[#d4e9e2]/60 border-[#d4e9e2] text-[#00754A]"
                                : review.vibe === "critical"
                                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-600"
                                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {review.vibe}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.ratingValue ? "fill-[#cba258] text-[#cba258]" : "text-gray-300 dark:text-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="space-y-1">
                      {review.title && <h5 className="font-bold text-base text-gray-900 dark:text-white">{review.title}</h5>}
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {review.content}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6 pt-2 border-t border-[#edebe9] dark:border-[#2b5148]/55">
                      <button
                        onClick={() => likeMutation.mutate(review.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors active:scale-95 ${
                          isLiked ? "text-[#00754A]" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{review.likes.length} Likes</span>
                      </button>

                      <button
                        onClick={() => {
                          const reason = prompt("Enter reason for reporting this review:");
                          if (reason?.trim()) {
                            reportMutation.mutate({ reviewId: review.id, reason });
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-450 hover:text-red-500 transition-colors font-bold cursor-pointer active:scale-95"
                      >
                        <AlertTriangle className="h-4 w-4" /> Report
                      </button>
                    </div>

                    {/* Comment Board */}
                    <div className="bg-[#f9f9f9] dark:bg-[#13221d] p-4 rounded-xl border border-[#edebe9] dark:border-[#2b5148] space-y-3">
                      <h6 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comments</h6>

                      {review.comments?.length > 0 && (
                        <div className="space-y-2 border-b border-[#edebe9] dark:border-[#2b5148] pb-2">
                          {review.comments.map((comment: any) => (
                            <div key={comment.id} className="text-xs">
                              <p className="font-bold text-gray-800 dark:text-gray-250">
                                {comment.user.username}{" "}
                                <span className="font-normal text-gray-400">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 mt-0.5">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[review.id] || ""}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [review.id]: e.target.value })}
                          className="flex-1 px-4 py-1.5 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#00754A] text-gray-800 dark:text-white"
                        />
                        <button
                          onClick={() => handlePostComment(review.id)}
                          className="btn-primary-filled text-xs py-1.5 px-4 cursor-pointer"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* AI Digital Book Reader Modal */}
      <AnimatePresence>
        {readerOpen && digitalBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden rounded-3xl shadow-2xl border transition-all duration-300 ${
                readerTheme === "sepia"
                  ? "bg-[#fbf6eb] text-[#433422] border-[#ebdcb9]"
                  : readerTheme === "dark"
                  ? "bg-[#121212] text-[#e0e0e0] border-[#2d2d2d]"
                  : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                readerTheme === "sepia"
                  ? "border-[#ebdcb9]"
                  : readerTheme === "dark"
                  ? "border-[#2d2d2d]"
                  : "border-gray-200"
              }`}>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs uppercase tracking-wider opacity-60">AI Digital Reader</h3>
                  <h2 className="font-black text-lg truncate">{book.title}</h2>
                </div>

                {/* Reader Options */}
                <div className="flex items-center gap-4">
                  {/* Font Controls */}
                  <div className="hidden sm:flex items-center border rounded-xl overflow-hidden p-0.5 border-current/25">
                    <button
                      onClick={() => setReaderFont("serif")}
                      className={`px-2.5 py-1 text-xs font-serif font-semibold rounded-lg ${
                        readerFont === "serif" ? "bg-primary text-white" : "hover:bg-current/5 text-current/80"
                      }`}
                    >
                      Serif
                    </button>
                    <button
                      onClick={() => setReaderFont("sans")}
                      className={`px-2.5 py-1 text-xs font-sans font-semibold rounded-lg ${
                        readerFont === "sans" ? "bg-primary text-white" : "hover:bg-current/5 text-current/80"
                      }`}
                    >
                      Sans
                    </button>
                  </div>

                  {/* Text Size Controls */}
                  <div className="hidden sm:flex items-center border rounded-xl overflow-hidden p-0.5 border-current/25">
                    <button
                      onClick={() => setReaderSize("sm")}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                        readerSize === "sm" ? "bg-primary text-white" : "hover:bg-current/5"
                      }`}
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setReaderSize("md")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        readerSize === "md" ? "bg-primary text-white" : "hover:bg-current/5"
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setReaderSize("lg")}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                        readerSize === "lg" ? "bg-primary text-white" : "hover:bg-current/5"
                      }`}
                    >
                      A+
                    </button>
                  </div>

                  {/* Themes */}
                  <div className="flex items-center gap-1.5">
                    {["sepia", "dark", "light"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setReaderTheme(t as any)}
                        className={`w-6 h-6 rounded-full border text-[10px] font-bold capitalize transition-all hover:scale-105 flex items-center justify-center ${
                          t === "sepia"
                            ? "bg-[#ebdcb9] text-[#433422] border-[#d3c095]"
                            : t === "dark"
                            ? "bg-black text-white border-gray-800"
                            : "bg-white text-black border-gray-300"
                        } ${readerTheme === t ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      >
                        {t[0]}
                      </button>
                    ))}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setReaderOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-current/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Main Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Table of Contents */}
                <div className={`w-64 border-r hidden md:flex flex-col overflow-y-auto p-4 space-y-2 ${
                  readerTheme === "sepia"
                    ? "border-[#ebdcb9] bg-[#f5ebd6]"
                    : readerTheme === "dark"
                    ? "border-[#2d2d2d] bg-[#161616]"
                    : "border-gray-200 bg-gray-50"
                }`}>
                  <h4 className="font-bold text-xs uppercase tracking-wider opacity-60 mb-2">Table of Contents</h4>
                  {digitalBook.chapters.map((ch: any, idx: number) => (
                    <button
                      key={ch.id}
                      onClick={() => setCurrentChapterIndex(idx)}
                      className={`text-left text-xs p-3 rounded-xl transition-all font-semibold flex flex-col gap-1 border border-transparent ${
                        currentChapterIndex === idx
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "hover:bg-current/5 text-current/80"
                      }`}
                    >
                      <span className="opacity-70 text-[9px] uppercase tracking-wider font-extrabold">Chapter {ch.chapterNumber}</span>
                      <span className="truncate">{ch.title}</span>
                    </button>
                  ))}
                </div>

                {/* Reader Pane */}
                <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 flex justify-center">
                  <div className={`max-w-2xl w-full space-y-6 ${
                    readerFont === "serif" ? "font-serif" : "font-sans"
                  } ${
                    readerSize === "sm" ? "text-sm" : readerSize === "lg" ? "text-lg" : "text-base"
                  }`}>
                    {/* Chapter Header */}
                    <div className="border-b pb-4 border-current/10 space-y-1">
                      <span className="text-xs uppercase tracking-wider font-bold opacity-60 font-sans">
                        Chapter {digitalBook.chapters[currentChapterIndex]?.chapterNumber} of {digitalBook.chapters.length}
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                        {digitalBook.chapters[currentChapterIndex]?.title}
                      </h1>
                    </div>

                    {/* Chapter Content */}
                    <div className="leading-relaxed space-y-4 whitespace-pre-line text-current/90 select-text font-medium">
                      {digitalBook.chapters[currentChapterIndex]?.content}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Bar */}
              <div className={`px-6 py-4 border-t flex items-center justify-between ${
                readerTheme === "sepia"
                  ? "border-[#ebdcb9] bg-[#f5ebd6]"
                  : readerTheme === "dark"
                  ? "border-[#2d2d2d] bg-[#161616]"
                  : "border-gray-200 bg-gray-50"
              }`}>
                {/* Chapter Select (Mobile only) */}
                <div className="md:hidden">
                  <select
                    value={currentChapterIndex}
                    onChange={(e) => setCurrentChapterIndex(parseInt(e.target.value))}
                    className="px-2.5 py-1 border rounded-lg bg-transparent text-xs font-semibold focus:outline-none"
                  >
                    {digitalBook.chapters.map((ch: any, idx: number) => (
                      <option key={ch.id} value={idx} className="bg-background text-foreground">
                        Ch {ch.chapterNumber}: {ch.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Progress Indicators */}
                <div className="hidden md:flex items-center gap-4 text-xs font-semibold opacity-70">
                  <span>Progress: {Math.round(((currentChapterIndex + 1) / digitalBook.chapters.length) * 100)}%</span>
                  <div className="w-32 h-1.5 bg-current/10 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${((currentChapterIndex + 1) / digitalBook.chapters.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Back / Next Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1))}
                    disabled={currentChapterIndex === 0}
                    className="inline-flex items-center gap-1 border border-current/25 hover:bg-current/5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={() => setCurrentChapterIndex(Math.min(digitalBook.chapters.length - 1, currentChapterIndex + 1))}
                    disabled={currentChapterIndex === digitalBook.chapters.length - 1}
                    className="inline-flex items-center gap-1 border border-current/25 hover:bg-current/5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
