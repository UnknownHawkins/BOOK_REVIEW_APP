"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { Check, X, ShieldAlert, Trash2 } from "lucide-react";

export default function ReviewModerationPage() {
  const queryClient = useQueryClient();

  const { data: reportsRes, isLoading } = useQuery({
    queryKey: ["adminReports"],
    queryFn: async () => {
      const res = await api.get("/admin/reports");
      return res.data;
    },
  });

  const reports = reportsRes?.reports || [];

  // Update report status (Dismiss or Resolve)
  const reportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const res = await api.put(`/admin/reports/${reportId}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      toast.success("Report queue updated");
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await api.delete(`/reviews/${reviewId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      toast.success("Inappropriate review removed from platform.");
    },
  });

  const handleResolveReport = (reportId: string) => {
    reportStatusMutation.mutate({ reportId, status: "RESOLVED" });
  };

  const handleDismissReport = (reportId: string) => {
    reportStatusMutation.mutate({ reportId, status: "DISMISSED" });
  };

  const handleDeleteReview = (review: any, reportId: string) => {
    const confirm = window.confirm(
      `Are you sure you want to delete ${review.user.username}'s review on "${review.book.title}"?`
    );
    if (confirm) {
      deleteReviewMutation.mutate(review.id);
      reportStatusMutation.mutate({ reportId, status: "RESOLVED" });
    }
  };

  if (isLoading) {
    return <p className="animate-pulse">Loading moderation reports...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderation Queue</h1>
        <p className="text-sm text-gray-500">Moderate reported reviews and process flags.</p>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-2xl bg-white dark:bg-gray-950/20">
          <Check className="h-12 w-12 text-green-600 mb-3" />
          <p className="font-bold text-gray-600 dark:text-gray-400">Queue is clean!</p>
          <p className="text-xs text-gray-400 mt-1">All reports have been successfully moderated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report: any) => (
            <div
              key={report.id}
              className={`border p-5 rounded-2xl bg-white dark:bg-gray-900 shadow-sm space-y-4 ${
                report.status === "PENDING" ? "border-amber-200 dark:border-amber-900/50 bg-amber-500/5" : ""
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                  <span className="font-bold">
                    Reported by {report.user.username}{" "}
                    <span className="font-normal text-gray-400">
                      on {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                </div>
                <span className="font-semibold text-gray-400">Status: {report.status}</span>
              </div>

              {/* Reason */}
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl text-xs space-y-1">
                <span className="font-bold text-gray-400">Reason for flag:</span>
                <p className="text-gray-700 dark:text-gray-300 font-medium italic">
                  &ldquo;{report.reason}&rdquo;
                </p>
              </div>

              {/* Reported review detail */}
              {report.review ? (
                <div className="border p-4 rounded-xl space-y-2 bg-white dark:bg-gray-950 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold">
                      Author: {report.review.user.username} | Book: {report.review.book.title}
                    </span>
                    <span className="font-bold text-amber-500">{report.review.ratingValue}/5 Stars</span>
                  </div>
                  {report.review.title && <h5 className="font-bold text-gray-800">{report.review.title}</h5>}
                  <p className="text-gray-500 leading-relaxed">{report.review.content}</p>
                </div>
              ) : (
                <p className="text-xs text-red-500 font-bold">[Review already deleted]</p>
              )}

              {/* Action buttons if Pending */}
              {report.status === "PENDING" && (
                <div className="flex justify-end gap-2 text-xs font-semibold">
                  <button
                    onClick={() => handleDismissReport(report.id)}
                    className="border px-3.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    Dismiss Flag
                  </button>
                  {report.review && (
                    <button
                      onClick={() => handleDeleteReview(report.review, report.id)}
                      className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 px-3.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove Review
                    </button>
                  )}
                  {!report.review && (
                    <button
                      onClick={() => handleResolveReport(report.id)}
                      className="bg-primary text-white px-3.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
