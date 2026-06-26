import React from "react";
import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface Author {
  name: string;
}

interface Category {
  name: string;
}

interface Book {
  id: string;
  title: string;
  thumbnail?: string | null;
  averageRating: number;
  pages?: number | null;
  color?: string | null;
  authors: Author[];
  categories: Category[];
}

export default function BookCard({ book }: { book: Book }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col bg-white dark:bg-[#1e3932] rounded-xl overflow-hidden card-shadow glow-card"
    >
      <Link href={`/books/${book.id}`} className="relative block aspect-[2/3] overflow-hidden bg-[#edebe9] dark:bg-[#13221d]">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-350 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 bg-gradient-to-br from-[#f2f0eb] to-[#edebe9] dark:from-[#1e3932] dark:to-[#13221d]">
            <BookOpen className="h-10 w-10 text-[#00754A] opacity-60 mb-2" />
            <span className="text-center font-bold text-sm line-clamp-3 text-foreground">{book.title}</span>
          </div>
        )}
      </Link>
      
      <div className="flex flex-1 flex-col p-4">
        {/* Genre Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {book.categories.slice(0, 2).map((cat) => (
            <span
              key={cat.name}
              className="inline-block text-[9px] font-black uppercase tracking-wider text-[#00754A] dark:text-[#d4e9e2] bg-[#d4e9e2]/30 dark:bg-[#00754A]/30 px-2 py-0.5 rounded-full"
            >
              {cat.name}
            </span>
          ))}
        </div>

        <Link
          href={`/books/${book.id}`}
          className="font-bold text-gray-900 dark:text-white line-clamp-1 hover:text-[#00754A] dark:hover:text-[#d4e9e2] transition-colors text-base"
        >
          {book.title}
        </Link>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
          by {book.authors.map((a) => a.name).join(", ") || "Unknown"}
        </p>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[#cba258] text-[#cba258]" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
              {book.averageRating.toFixed(1)}
            </span>
          </div>
          
          {book.pages && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {book.pages} p.
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
