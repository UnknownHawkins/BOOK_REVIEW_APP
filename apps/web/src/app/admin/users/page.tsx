"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Trash2, User } from "lucide-react";

export default function UserManagementPage() {
  const queryClient = useQueryClient();

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data;
    },
  });

  const users = usersRes?.users || [];

  // Toggle role mutation
  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.put(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User role updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update role");
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete user");
    },
  });

  const handleRoleToggle = (userItem: any) => {
    const targetRole = userItem.role === "admin" ? "user" : "admin";
    const confirm = window.confirm(`Are you sure you want to change ${userItem.username}'s role to ${targetRole}?`);
    if (confirm) {
      roleMutation.mutate({ userId: userItem.id, role: targetRole });
    }
  };

  const handleDeleteUser = (userItem: any) => {
    const confirm = window.confirm(`Are you absolutely sure you want to delete ${userItem.username}? All their review data will be wiped.`);
    if (confirm) {
      deleteMutation.mutate(userItem.id);
    }
  };

  if (isLoading) {
    return <p className="animate-pulse">Loading users list...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-gray-500">Edit member roles, view details, or delete system accounts.</p>
      </div>

      {/* Users table */}
      <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-950 border-b text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Avatar</th>
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20">
                  <td className="p-4">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold dark:bg-blue-900/50">
                      {u.avatar || u.username.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td className="p-4 font-bold">{u.username}</td>
                  <td className="p-4 text-gray-500">{u.email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleRoleToggle(u)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-amber-500 cursor-pointer"
                      title="Toggle Admin Privilege"
                    >
                      {u.role === "admin" ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-red-500 cursor-pointer"
                      title="Delete User Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
