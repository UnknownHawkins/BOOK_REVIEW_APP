"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { BarChart3, BookOpen, Flame, Calendar, Sparkles } from "lucide-react";

export default function ReadingInsightsPage() {
  const { data: insightsRes, isLoading } = useQuery({
    queryKey: ["readingInsights"],
    queryFn: async () => {
      const res = await api.get("/users/me/insights");
      return res.data;
    },
  });

  const insights = insightsRes?.insights || {
    totalBooks: 0,
    completedBooks: 0,
    readingBooks: 0,
    totalPagesRead: 0,
    topGenres: [],
    currentStreak: 0,
    pagesPerDay: 0,
  };

  const statCards = [
    {
      name: "Logged Books",
      value: insights.totalBooks,
      sub: `${insights.completedBooks} Completed, ${insights.readingBooks} Reading`,
      icon: BookOpen,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      name: "Pages Read",
      value: insights.totalPagesRead,
      sub: "Total pages cataloged",
      icon: BarChart3,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      name: "Reading Streak",
      value: `${insights.currentStreak} Days`,
      sub: "Consecutive daily progress logs",
      icon: Flame,
      color: "text-orange-500 bg-orange-500/10",
    },
    {
      name: "Reading Speed",
      value: `~${insights.pagesPerDay}`,
      sub: "Average pages read daily",
      icon: Calendar,
      color: "text-green-500 bg-green-500/10",
    },
  ];

  if (isLoading) {
    return <p className="animate-pulse">Loading reading insights...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">Reading Insights</h1>
        <p className="text-sm text-gray-500">Track and analyze your cataloging and progress data.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="border p-5 rounded-2xl bg-white dark:bg-gray-900 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">{card.name}</span>
                <h4 className="text-xl font-extrabold">{card.value}</h4>
                <p className="text-[10px] text-gray-500 truncate">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Insights Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Genres Card */}
        <div className="bg-white dark:bg-gray-900 border p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-200">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            Favorite Genres
          </div>
          {insights.topGenres.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              Add books to your library to see genre preferences.
            </p>
          ) : (
            <div className="space-y-3">
              {insights.topGenres.map((g: any, idx: number) => (
                <div key={g.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{g.name}</span>
                    <span className="text-gray-400">{g.count} Books</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${(g.count / insights.totalBooks) * 100}%`,
                        opacity: 1 - idx * 0.25,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dashboard CTA tips */}
        <div className="bg-white dark:bg-gray-900 border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="font-bold text-base">Start Reading Today!</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Updating your pages logged daily raises your Reading Streak and allows BookHub to analyze your velocity accurately. Write reviews with Vibe Check to unlock customized recommendations.
            </p>
          </div>
          <Link
            href="/books"
            className="mt-6 block text-center bg-primary hover:bg-primary/95 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Find a Book
          </Link>
        </div>
      </div>
    </div>
  );
}
