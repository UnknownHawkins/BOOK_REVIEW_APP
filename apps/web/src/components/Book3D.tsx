import React from "react";

interface Book3DProps {
  title: string;
  coverUrl?: string | null;
  color?: string | null;
}

export default function Book3D({ title, coverUrl, color }: Book3DProps) {
  // Default to a dark professional slate blue cover if not provided
  const baseColor = color || "#1e3a8a";

  return (
    <div className="book-3d-container select-none">
      <div className="book-3d-wrapper">
        <div className="book-3d">
          {/* Front Cover */}
          <div
            className="book-3d-front flex flex-col justify-between p-4 text-white border border-white/10"
            style={{
              backgroundColor: baseColor,
              backgroundImage: coverUrl ? `url(${coverUrl})` : "none",
            }}
          >
            {!coverUrl && (
              <>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Classical Edition</span>
                <span className="font-black text-sm text-center leading-snug line-clamp-4 my-auto drop-shadow-md">
                  {title}
                </span>
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-center opacity-50">
                  BookHub Scholar
                </span>
              </>
            )}
          </div>

          {/* Spine */}
          <div
            className="book-3d-spine border-y border-l border-white/10"
            style={{ backgroundColor: baseColor }}
          ></div>

          {/* Pages */}
          <div className="book-3d-pages"></div>

          {/* Back Cover */}
          <div
            className="book-3d-back border border-white/10"
            style={{ backgroundColor: baseColor }}
          ></div>
        </div>
      </div>
    </div>
  );
}
