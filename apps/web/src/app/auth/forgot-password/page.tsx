"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { BookOpen, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenReceived, setTokenReceived] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "Reset link generated");
      if (res.data.resetToken) {
        setTokenReceived(res.data.resetToken);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-950 px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 border p-8 rounded-2xl shadow-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-2xl text-primary mb-2">
            <BookOpen className="h-7 w-7" />
            <span>BookHub</span>
          </Link>
          <h2 className="text-xl font-bold">Reset your password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We will send you instructions to reset your password.
          </p>
        </div>

        {tokenReceived ? (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              [DEVELOPMENT MODE - SIMULATED RESET LINK]
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click the link below to apply your password reset:
            </p>
            <Link
              href={`/auth/reset-password?token=${tokenReceived}`}
              className="block text-center text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg"
            >
              Reset Password Page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
