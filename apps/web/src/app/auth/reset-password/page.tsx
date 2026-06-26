"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { BookOpen, Lock, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link. Missing token.");
      router.push("/auth/login");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        password,
      });

      toast.success("Password reset successful. Please log in.");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed. Password may be weak.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          New Password
        </label>
        <div className="relative">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters, Upper, Digit, Symbol"
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-950 px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 border p-8 rounded-2xl shadow-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-2xl text-primary mb-2">
            <BookOpen className="h-7 w-7" />
            <span>BookHub</span>
          </Link>
          <h2 className="text-xl font-bold">Create new password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set your new credentials below.
          </p>
        </div>

        <Suspense fallback={<p className="text-center text-sm">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>

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
