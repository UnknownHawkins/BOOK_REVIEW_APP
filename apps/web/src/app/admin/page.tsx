"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Users, BookMarked, MessageSquare, Heart, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminAnalyticsPage() {
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics");
      return res.data;
    },
  });

  const stats = analyticsRes?.analytics || {
    counts: { users: 0, books: 0, reviews: 0, ratings: 0 },
    vibesDistribution: [],
    categoriesDistribution: [],
    readingStatusBreakdown: [],
  };

  const statCards = [
    { name: "Total Users", value: stats.counts.users, icon: Users, color: "text-blue-600 bg-blue-500/10" },
    { name: "Books Listed", value: stats.counts.books, icon: BookMarked, color: "text-green-600 bg-green-500/10" },
    { name: "Reviews Written", value: stats.counts.reviews, icon: MessageSquare, color: "text-indigo-600 bg-indigo-500/10" },
    { name: "Ratings Count", value: stats.counts.ratings, icon: Heart, color: "text-red-600 bg-red-500/10" },
  ];

  if (isLoading) {
    return <p className="animate-pulse">Loading analytics dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">System Analytics</h1>
        <p className="text-sm text-gray-500">Live operational overview of BookHub database parameters.</p>
      </div>

      {/* Stats row */}
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid for graphs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="bg-white dark:bg-gray-900 border p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-200">
            <TrendingUp className="h-4.5 w-4.5 text-green-600" />
            Books Category Distribution
          </div>
          <div className="space-y-3.5">
            {stats.categoriesDistribution.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No categories exist.</p>
            ) : (
              stats.categoriesDistribution.map((cat: any) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{cat.name}</span>
                    <span className="text-gray-400">{cat.count} Books</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${Math.min((cat.count / Math.max(stats.counts.books, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review Vibe distribution */}
        <div className="bg-white dark:bg-gray-900 border p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-200">
            <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
            Reviews Vibe Breakdown
          </div>
          <div className="space-y-3.5">
            {stats.vibesDistribution.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No reviews written.</p>
            ) : (
              stats.vibesDistribution.map((vibe: any) => (
                <div key={vibe.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="capitalize">{vibe.name}</span>
                    <span className="text-gray-400">{vibe.count} Reviews</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${Math.min((vibe.count / Math.max(stats.counts.reviews, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
