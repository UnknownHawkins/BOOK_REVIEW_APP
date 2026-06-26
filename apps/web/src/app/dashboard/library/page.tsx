"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { BookOpen, Edit2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function MyLibraryPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: libraryRes, isLoading } = useQuery({
    queryKey: ["userLibrary"],
    queryFn: async () => {
      const res = await api.get("/users/me/library");
      return res.data;
    },
  });

  const library = libraryRes?.library || [];

  // Update progress mutation
  const progressMutation = useMutation({
    mutationFn: async ({ bookId, status, pagesRead }: { bookId: string; status: string; pagesRead: number }) => {
      const res = await api.put(`/users/me/library/${bookId}`, { status, pagesRead });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLibrary"] });
      toast.success("Progress updated successfully");
    },
  });

  const filteredLibrary = library.filter((entry: any) => {
    if (filter === "all") return true;
    return entry.status === filter;
  });

  const handleQuickPageIncrement = (entry: any) => {
    const totalPages = entry.book.pages || 100;
    const currentRead = entry.pagesRead;
    const newRead = Math.min(currentRead + 10, totalPages);
    const newStatus = newRead === totalPages ? "COMPLETED" : entry.status;

    progressMutation.mutate({
      bookId: entry.bookId,
      status: newStatus,
      pagesRead: newRead,
    });
  };

  const handleMarkAsCompleted = (entry: any) => {
    progressMutation.mutate({
      bookId: entry.bookId,
      status: "COMPLETED",
      pagesRead: entry.book.pages || 0,
    });
  };

  if (isLoading) {
    return <p className="animate-pulse">Loading library...</p>;
  }

  const statuses = [
    { key: "all", label: "All Books" },
    { key: "READING", label: "Reading" },
    { key: "PLAN_TO_READ", label: "Plan to Read" },
    { key: "COMPLETED", label: "Completed" },
    { key: "ON_HOLD", label: "On Hold" },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Library</h1>
          <p className="text-sm text-gray-500">Log and track pages read across your library collection.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {statuses.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              filter === tab.key
                ? "bg-primary border-primary text-white"
                : "bg-white dark:bg-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Library List */}
      {filteredLibrary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-2xl bg-white dark:bg-gray-950/20">
          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
          <p className="font-bold text-gray-600 dark:text-gray-400">Library is empty</p>
          <p className="text-xs text-gray-400 mt-1">Explore books to add them to your shelf.</p>
          <Link href="/books" className="mt-4 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredLibrary.map((entry: any) => {
            const book = entry.book;
            const percentage = book.pages ? Math.min(Math.round((entry.pagesRead / book.pages) * 100), 100) : 0;

            return (
              <motion.div
                key={entry.id}
                layout
                className="border p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-sm flex gap-4 items-center justify-between"
              >
                <div className="flex gap-4 items-center flex-1 min-w-0">
                  {/* Thumbnail */}
                  <Link
                    href={`/books/${book.id}`}
                    className="relative block h-20 w-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0"
                  >
                    {book.thumbnail ? (
                      <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/30 text-xs">
                        {book.title.charAt(0)}
                      </div>
                    )}
                  </Link>

                  {/* Text details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      href={`/books/${book.id}`}
                      className="font-bold text-sm block truncate hover:text-primary transition-colors"
                    >
                      {book.title}
                    </Link>
                    <p className="text-xs text-gray-400 truncate">
                      by {book.authors.map((a: any) => a.name).join(", ")}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-gray-500">
                        <span>{entry.status.replace("_", " ")}</span>
                        <span>
                          {entry.pagesRead} / {book.pages || "?"} p. ({percentage}%)
                        </span>
                      </div>
                      {book.pages && (
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {entry.status === "READING" && book.pages && entry.pagesRead < book.pages && (
                    <button
                      onClick={() => handleQuickPageIncrement(entry)}
                      className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <Play className="h-3 w-3" /> +10 Pages
                    </button>
                  )}
                  {entry.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleMarkAsCompleted(entry)}
                      className="inline-flex items-center gap-1 border hover:bg-gray-100 dark:hover:bg-gray-800 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-3 w-3 text-green-600" /> Complete
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
