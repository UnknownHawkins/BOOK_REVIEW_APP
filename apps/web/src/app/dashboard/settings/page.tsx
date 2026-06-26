"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { User, ShieldAlert, Download, Trash2, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await api.put("/users/me", { username, email, avatar });
      setUser(res.data.user);
      toast.success("Profile details updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    // Open in new tab which prompts file download of the JSON
    const token = localStorage.getItem("bookhub_token");
    const exportUrl = `http://localhost:5000/api/users/me/export?token=${token}`;
    window.open(exportUrl, "_blank");
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone."
    );
    if (!confirm) return;

    try {
      await api.delete("/users/me");
      logout();
      toast.success("Your account has been deleted.");
    } catch (err) {
      toast.error("Could not delete account. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-sm text-gray-500">Manage your profile details, avatar and account preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Col - Edit info */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Edit Details</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl bg-white dark:bg-gray-950 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Profile Letter or Image URL</label>
                <input
                  type="text"
                  required
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  maxLength={500}
                  placeholder="A single letter, or image URL"
                  className={`w-full px-3.5 py-2 border rounded-xl bg-white dark:bg-gray-950 text-sm focus:outline-none ${
                    avatar.startsWith("http") || avatar.startsWith("/") || avatar.startsWith("data:") ? "" : "uppercase text-center"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border rounded-xl bg-white dark:bg-gray-950 text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Right Col - Danger / Data Zone */}
        <div className="bg-white dark:bg-gray-900 border p-5 rounded-2xl shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-red-600 dark:text-red-400">
              <ShieldAlert className="h-4.5 w-4.5" />
              Account Management
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="font-bold text-xs">Export Personal Data</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Download all data associated with your profile (GDPR Compliance).
                </p>
                <button
                  onClick={handleExportData}
                  className="mt-1.5 inline-flex items-center gap-1.5 border hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg text-[10px] font-semibold w-full justify-center cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download JSON
                </button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-1">
            <h4 className="font-bold text-xs text-red-600 dark:text-red-400">Danger Zone</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Delete account permanently. This deletes libraries, ratings, and reviews.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="mt-2 inline-flex items-center gap-1.5 border border-red-200/50 dark:border-red-950/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 py-1.5 rounded-lg text-[10px] font-bold w-full justify-center cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
