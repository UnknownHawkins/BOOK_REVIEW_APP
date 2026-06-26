"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookCard from "@/components/BookCard";
import { api } from "@/utils/api";
import { Search, Filter, SlidersHorizontal, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function BooksBrowsePage() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [order, setOrder] = useState("asc");

  // Genres selection options
  const genresList = ["Classic", "Fiction", "Indian", "Epic", "Dystopian", "Romance"];

  const { data: booksRes, isLoading } = useQuery({
    queryKey: ["books", search, genre, sortBy, order],
    queryFn: async () => {
      const res = await api.get("/books", {
        params: {
          search,
          genre,
          sortBy,
          order,
        },
      });
      return res.data;
    },
  });

  const books = booksRes?.books || [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight">Explore the Library</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Search our collection of classic literature, Indian epics, and modern releases.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="mb-8 grid md:grid-cols-4 gap-4 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Search by title, author, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          </div>

          {/* Genre select */}
          <div className="relative">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm appearance-none cursor-pointer"
            >
              <option value="">All Genres</option>
              {genresList.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setOrder(e.target.value === "createdAt" ? "desc" : "asc");
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm appearance-none cursor-pointer"
            >
              <option value="title">Sort by: Title</option>
              <option value="rating">Sort by: Rating</option>
              <option value="createdAt">Sort by: Date Added</option>
            </select>
            <SlidersHorizontal className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Library Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4 border p-4 rounded-2xl bg-white dark:bg-gray-900/50">
                <div className="aspect-[2/3] w-full rounded-xl bg-gray-200 dark:bg-gray-800"></div>
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800"></div>
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800"></div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
            <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-bold">No books found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm text-center">
              Try adjusting your search keywords, or selecting a different genre.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((book: any) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
