"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { Plus, BookOpen, Save, X, Image as ImageIcon } from "lucide-react";

export default function BookManagementPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [categories, setCategories] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [pages, setPages] = useState("");
  const [publishedYear, setPublishedYear] = useState("");
  const [language, setLanguage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [hindiPdfUrl, setHindiPdfUrl] = useState("");
  const [contentPreview, setContentPreview] = useState("");
  const [color, setColor] = useState("#3b82f6");

  // Fetch books
  const { data: booksRes, isLoading } = useQuery({
    queryKey: ["adminBooks"],
    queryFn: async () => {
      const res = await api.get("/books", { params: { limit: 50 } });
      return res.data;
    },
  });

  const books = booksRes?.books || [];

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/books", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBooks"] });
      toast.success("Book created successfully!");
      // Reset form
      setTitle("");
      setAuthors("");
      setCategories("");
      setDescription("");
      setThumbnail("");
      setPages("");
      setPublishedYear("");
      setLanguage("");
      setPdfUrl("");
      setHindiPdfUrl("");
      setContentPreview("");
      setColor("#3b82f6");
      setShowAddForm(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create book");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const authorsArr = authors.split(",").map((a) => a.trim()).filter(Boolean);
    const categoriesArr = categories.split(",").map((c) => c.trim()).filter(Boolean);

    if (authorsArr.length === 0 || categoriesArr.length === 0) {
      toast.error("At least one author and one category genre are required");
      return;
    }

    createBookMutation.mutate({
      title,
      description,
      thumbnail: thumbnail || undefined,
      pages: pages ? parseInt(pages, 10) : undefined,
      publishedYear,
      language,
      pdfUrl: pdfUrl || undefined,
      hindiPdfUrl: hindiPdfUrl || undefined,
      contentPreview,
      color,
      authors: authorsArr,
      categories: categoriesArr,
    });
  };

  if (isLoading) {
    return <p className="animate-pulse">Loading book entries...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Book Catalog</h1>
          <p className="text-sm text-gray-500">Add, edit or update catalog books.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Close Form" : "Add Book"}
        </button>
      </div>

      {/* Add book form */}
      {showAddForm && (
        <div className="border p-6 rounded-2xl bg-white dark:bg-gray-950 shadow-sm space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Create New Catalog Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Book Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Ramayana"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Color Palette Hex</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Authors (comma separated) *</label>
                <input
                  type="text"
                  required
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="Valmiki, Vyasa"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Categories (comma separated) *</label>
                <input
                  type="text"
                  required
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="Indian, Epic, Classic"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pages Count</label>
                <input
                  type="number"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Published Year</label>
                <input
                  type="text"
                  value={publishedYear}
                  onChange={(e) => setPublishedYear(e.target.value)}
                  placeholder="500 BCE"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="Sanskrit, Hindi"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cover Image URL</label>
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">PDF Link (English)</label>
                <input
                  type="text"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://example.com/book.pdf"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">PDF Link (Hindi)</label>
                <input
                  type="text"
                  value={hindiPdfUrl}
                  onChange={(e) => setHindiPdfUrl(e.target.value)}
                  placeholder="https://example.com/book-hindi.pdf"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Book Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary..."
                className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={createBookMutation.isPending}
              className="bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {createBookMutation.isPending ? "Creating..." : "Save Book"}
            </button>
          </form>
        </div>
      )}

      {/* Book List table */}
      <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-950 border-b text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Cover</th>
                <th className="p-4">Title</th>
                <th className="p-4">Author(s)</th>
                <th className="p-4">Categories</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Pages</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {books.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20">
                  <td className="p-4">
                    <div className="h-10 w-7 rounded overflow-hidden bg-gray-50">
                      {b.thumbnail ? (
                        <img src={b.thumbnail} alt={b.title} className="object-cover w-full h-full" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold">{b.title}</td>
                  <td className="p-4 text-gray-500">{b.authors?.map((a: any) => a.name).join(", ")}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {b.categories?.map((c: any) => (
                        <span key={c.name} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-amber-500">{b.averageRating.toFixed(1)}/5</td>
                  <td className="p-4 text-gray-400">{b.pages || "?"} p.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
