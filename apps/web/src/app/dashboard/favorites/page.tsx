"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { Heart, Trash2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function FavoritesPage() {
  const queryClient = useQueryClient();

  const { data: favsRes, isLoading } = useQuery({
    queryKey: ["userFavorites"],
    queryFn: async () => {
      const res = await api.get("/users/me/favorites");
      return res.data;
    },
  });

  const favorites = favsRes?.favorites || [];

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const res = await api.post("/users/me/favorites", { bookId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userFavorites"] });
      toast.success("Favorites updated");
    },
  });

  if (isLoading) {
    return <p className="animate-pulse">Loading favorites...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Favorites</h1>
        <p className="text-sm text-gray-500">Your curated shelf of favorite books.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-2xl bg-white dark:bg-gray-950/20">
          <Heart className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
          <p className="font-bold text-gray-600 dark:text-gray-400">No favorites selected</p>
          <p className="text-xs text-gray-400 mt-1">Mark books as favorite during reading or details inspection.</p>
          <Link href="/books" className="mt-4 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map((fav: any) => {
            const book = fav.book;
            return (
              <motion.div
                key={fav.id}
                layout
                className="border p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-sm flex flex-col justify-between"
              >
                <div className="flex gap-4 items-center mb-4">
                  <Link
                    href={`/books/${book.id}`}
                    className="relative block h-16 w-11 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0"
                  >
                    {book.thumbnail ? (
                      <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/30 text-xs">
                        {book.title.charAt(0)}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/books/${book.id}`}
                      className="font-bold text-sm block truncate hover:text-primary transition-colors"
                    >
                      {book.title}
                    </Link>
                    <p className="text-xs text-gray-400 truncate">
                      by {book.authors?.map((a: any) => a.name).join(", ") || "Unknown"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFavoriteMutation.mutate(book.id)}
                  className="w-full inline-flex items-center justify-center gap-1.5 border border-red-200/50 dark:border-red-900/30 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove Favorite
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
