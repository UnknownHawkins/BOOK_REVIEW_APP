"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, Heart, Bookmark, BarChart3, Settings, User } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-pulse">Redirecting to login...</p>
      </div>
    );
  }

  const sidebarLinks = [
    { name: "Reading Insights", href: "/dashboard", icon: BarChart3 },
    { name: "My Library", href: "/dashboard/library", icon: BookOpen },
    { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
    { name: "Wishlist", href: "/dashboard/wishlist", icon: Bookmark },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Navbar />

      <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* User card info */}
            <div className="bg-white dark:bg-gray-900 border p-5 rounded-2xl shadow-sm text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-extrabold text-2xl dark:bg-blue-900/50 overflow-hidden">
                {user?.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/") || user.avatar.startsWith("data:")) ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.avatar || user?.username.charAt(0).toUpperCase()
                )}
              </div>
              <h2 className="mt-3 font-extrabold text-lg">{user?.username}</h2>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500">
                {user?.role}
              </span>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Subcontent */}
          <main className="md:col-span-3">{children}</main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
