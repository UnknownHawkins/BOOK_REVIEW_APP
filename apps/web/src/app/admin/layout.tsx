"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BarChart3, Users, BookMarked, MessageSquareWarning, ClipboardList, Shield } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else if (user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-pulse">Checking administrator credentials...</p>
      </div>
    );
  }

  const sidebarLinks = [
    { name: "Analytics", href: "/admin", icon: BarChart3 },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Book Management", href: "/admin/books", icon: BookMarked },
    { name: "Moderation Queue", href: "/admin/reviews", icon: MessageSquareWarning },
    { name: "Activity Logs", href: "/admin/logs", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Navbar />

      <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Header info */}
            <div className="bg-white dark:bg-gray-900 border p-5 rounded-2xl shadow-sm text-center border-amber-200/50 dark:border-amber-950/20 bg-amber-500/5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <Shield className="h-7 w-7" />
              </div>
              <h2 className="mt-3 font-extrabold text-base">Admin Dashboard</h2>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">System Administration</p>
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
                        ? "bg-amber-600 text-white shadow-sm"
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

          {/* Main admin content */}
          <main className="md:col-span-3">{children}</main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
