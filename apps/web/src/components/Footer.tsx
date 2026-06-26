import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#1E3932] text-white py-12 transition-colors duration-200 border-t-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <BookOpen className="h-6 w-6 text-[#d4e9e2]" />
            <span className="font-extrabold tracking-tight">
              BookHub
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-white/70">
            <Link href="/books" className="hover:text-[#cba258] transition-colors">
              Browse Books
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#cba258] transition-colors">
              GitHub
            </a>
            <Link href="/privacy" className="hover:text-[#cba258] transition-colors">
              Privacy Policy
            </Link>
          </div>
          
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} BookHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
