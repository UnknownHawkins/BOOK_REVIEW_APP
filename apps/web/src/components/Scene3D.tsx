"use client";

import React, { useEffect, useState } from "react";

export type SceneVariant = "library" | "reading" | "review";

/* ═══════════════════════════════════════════════════════════════
   LIBRARY SCENE — Grand stacked book tower with floating dust motes
═══════════════════════════════════════════════════════════════ */
const STACK = [
  { color: "#0f2318", accent: "#cba258", h: 42, off: 0,   z: 0,   tilt: 0,    title: "PHILOSOPHY" },
  { color: "#1e3932", accent: "#d4e9e2", h: 36, off: -6,  z: 42,  tilt: -2.5, title: "POETRY" },
  { color: "#2d5a4a", accent: "#b8963a", h: 40, off: 5,   z: 78,  tilt: 1.8,  title: "HISTORY" },
  { color: "#4a7c59", accent: "#f5e6c0", h: 34, off: -3,  z: 118, tilt: -1.2, title: "FICTION" },
  { color: "#6b3a2a", accent: "#f0d080", h: 38, off: 8,   z: 152, tilt: 2.1,  title: "SCIENCE" },
];

function DustMote({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "rgba(203,162,88,0.45)",
        animation: `dust-float 6s ease-in-out ${delay}s infinite`,
        pointerEvents: "none",
      }}
    />
  );
}

function LibraryScene() {
  return (
    <div className="books-stack-wrapper select-none" style={{ position: "relative" }}>
      {/* Ambient light cone from above */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 120, height: 200,
        background: "radial-gradient(ellipse at top, rgba(203,162,88,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div className="books-stack" style={{ width: 220, height: 320 }}>
        {/* Ground shadow */}
        <div style={{
          position: "absolute", bottom: -32, left: "50%", transform: "translateX(-50%)",
          width: 200, height: 32,
          background: "radial-gradient(ellipse, rgba(0,0,0,0.28) 0%, transparent 70%)",
          filter: "blur(10px)",
        }} />

        {/* Books */}
        {STACK.map((b, i) => (
          <div key={i} className="stacked-book" style={{
            height: b.h, backgroundColor: b.color,
            bottom: b.z, left: `${10 + b.off}px`,
            transform: `rotate(${b.tilt}deg)`,
            boxShadow: `2px 4px 14px rgba(0,0,0,0.32), inset 0 0 0 1px ${b.accent}20`,
            width: 190,
          }}>
            {/* Spine */}
            <div style={{
              position: "absolute", left: 0, top: 0, width: 16, height: "100%",
              background: `linear-gradient(90deg, ${b.accent}30, ${b.accent}10)`,
              borderRight: `1px solid ${b.accent}40`,
            }} />
            {/* Cover title text */}
            <div style={{
              position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)",
              fontSize: 7, letterSpacing: "0.15em", color: b.accent, opacity: 0.7,
              fontFamily: "Georgia, serif", fontWeight: 700, textTransform: "uppercase",
            }}>
              {b.title}
            </div>
            {/* Gold foil line */}
            <div style={{
              position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)",
              width: "28%", height: 1, backgroundColor: b.accent, opacity: 0.5,
            }} />
            {/* Inner page edge */}
            <div style={{
              position: "absolute", right: 0, top: 3, bottom: 3, width: 2,
              background: "rgba(250,248,244,0.6)",
            }} />
          </div>
        ))}

        {/* Bookmark ribbon */}
        <div style={{
          position: "absolute", right: 36, top: -28, width: 10, height: 56,
          background: "linear-gradient(to bottom, #cba258, #7a4f1a)",
          clipPath: "polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)",
          zIndex: 20, boxShadow: "1px 2px 6px rgba(0,0,0,0.3)",
        }} />

        {/* Floating dust motes */}
        {[
          { x: 20, y: 60, d: 0, s: 2.5 },
          { x: 160, y: 40, d: 1.2, s: 1.8 },
          { x: 80, y: 20, d: 2.5, s: 3 },
          { x: 140, y: 90, d: 0.8, s: 2 },
        ].map((m, i) => <DustMote key={i} x={m.x} y={m.y} delay={m.d} size={m.s} />)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   READING SCENE — Immersive open book with detailed pages
═══════════════════════════════════════════════════════════════ */
function ReadingScene() {
  return (
    <div className="book-open-wrapper select-none">
      <div style={{ position: "relative" }}>

        {/* Ambient reading lamp glow from top-right */}
        <div style={{
          position: "absolute", top: -60, right: -30, width: 140, height: 140,
          background: "radial-gradient(circle, rgba(203,162,88,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="book-open">
          {/* LEFT PAGE */}
          <div className="book-open-left">
            {/* Chapter heading */}
            <div style={{
              position: "absolute", left: "50%", top: 10, transform: "translateX(-50%)",
              fontSize: 7, letterSpacing: "0.2em", color: "rgba(0,0,0,0.35)",
              fontFamily: "Georgia, serif", textTransform: "uppercase",
            }}>Chapter IV</div>

            {/* Decorative rule */}
            <div style={{
              position: "absolute", left: 14, right: 14, top: 20, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.15), transparent)",
            }} />

            {/* Text lines with varying widths for realistic paragraph feel */}
            {[0.92, 0.88, 0.94, 0.86, 0.90, 0.75, 0.92, 0.88].map((w, i) => (
              <div key={i} style={{
                position: "absolute", left: 14, top: 28 + i * 22,
                height: 1, width: `${w * (100 - 15)}%`,
                backgroundColor: "rgba(0,0,0,0.07)", borderRadius: 1,
              }} />
            ))}

            {/* Highlighted line */}
            <div style={{
              position: "absolute", left: 14, top: 28 + 3 * 22, right: 28,
              height: 9, backgroundColor: "rgba(203,162,88,0.12)",
              borderRadius: 2, marginTop: -4, zIndex: 0,
            }} />

            {/* Footnote divider */}
            <div style={{
              position: "absolute", left: 14, bottom: 22, width: 60, height: 1,
              backgroundColor: "rgba(0,0,0,0.15)",
            }} />
            <div style={{
              position: "absolute", left: 14, bottom: 12,
              fontSize: 7, color: "rgba(0,0,0,0.28)", fontFamily: "Georgia, serif",
            }}>¹ See appendix, p. 412.</div>

            {/* Page number */}
            <div style={{
              position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
              fontSize: 8, color: "rgba(0,0,0,0.28)", fontFamily: "Georgia, serif",
            }}>203</div>
          </div>

          {/* RIGHT PAGE */}
          <div className="book-open-right">
            {/* Folio header */}
            <div style={{
              position: "absolute", left: "50%", top: 10, transform: "translateX(-50%)",
              fontSize: 7, letterSpacing: "0.12em", color: "rgba(0,0,0,0.3)",
              fontFamily: "Georgia, serif", fontStyle: "italic",
            }}>The Literary Journey</div>
            <div style={{
              position: "absolute", left: 14, right: 14, top: 20, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.15), transparent)",
            }} />

            {/* Drop cap box */}
            <div style={{
              position: "absolute", left: 14, top: 28, width: 26, height: 26,
              border: "1px solid rgba(0,0,0,0.18)",
              backgroundColor: "rgba(203,162,88,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontFamily: "Georgia, serif", color: "rgba(0,0,0,0.5)",
            }}>T</div>

            {[0.62, 0.90, 0.88, 0.92, 0.84, 0.90, 0.78].map((w, i) => (
              <div key={i} style={{
                position: "absolute",
                left: i === 0 ? 46 : 14,
                top: 28 + i * 22,
                height: 1,
                width: `${w * (100 - (i === 0 ? 40 : 15))}%`,
                backgroundColor: "rgba(0,0,0,0.07)", borderRadius: 1,
              }} />
            ))}

            {/* Marginalia annotation */}
            <div style={{
              position: "absolute", right: 4, top: 80,
              fontSize: 6.5, color: "rgba(107,78,42,0.7)",
              fontFamily: "Georgia, serif", fontStyle: "italic",
              writingMode: "vertical-rl", textOrientation: "mixed",
              transform: "rotate(180deg)",
              lineHeight: 1.3,
            }}>remarkable ↗</div>

            <div style={{
              position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
              fontSize: 8, color: "rgba(0,0,0,0.28)", fontFamily: "Georgia, serif",
            }}>204</div>
          </div>

          {/* Spine */}
          <div className="book-open-spine" />

          {/* Page-turn shimmer */}
          <div style={{
            position: "absolute", right: 0, top: 0, width: "50%", height: "100%",
            background: "linear-gradient(90deg, transparent 55%, rgba(255,255,255,0.16) 78%, transparent 100%)",
            animation: "shimmer-page 5s ease-in-out infinite", pointerEvents: "none",
          }} />
        </div>

        {/* Floor shadow */}
        <div className="book-open-shadow" />

        {/* Reading glasses — larger, more realistic */}
        <div style={{
          position: "absolute", top: -42, left: "50%",
          transform: "translateX(-50%) rotate(-6deg)",
          display: "flex", alignItems: "center", gap: 0, opacity: 0.6,
        }}>
          <div style={{
            position: "relative", width: 34, height: 22,
            border: "1.8px solid #5a3d1a",
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            backgroundColor: "rgba(200,230,220,0.08)",
          }}>
            {/* Lens reflection */}
            <div style={{
              position: "absolute", top: 3, left: 6, width: 8, height: 4,
              borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.25)",
              transform: "rotate(-30deg)",
            }} />
          </div>
          <div style={{ width: 14, height: 1.8, backgroundColor: "#5a3d1a" }} />
          <div style={{
            position: "relative", width: 34, height: 22,
            border: "1.8px solid #5a3d1a",
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            backgroundColor: "rgba(200,230,220,0.08)",
          }}>
            <div style={{
              position: "absolute", top: 3, left: 6, width: 8, height: 4,
              borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.25)",
              transform: "rotate(-30deg)",
            }} />
          </div>
        </div>

        {/* Sticky note / annotation on corner */}
        <div style={{
          position: "absolute", bottom: 20, right: -18,
          width: 52, height: 52,
          backgroundColor: "rgba(245,230,180,0.9)",
          boxShadow: "2px 3px 8px rgba(0,0,0,0.2)",
          transform: "rotate(5deg)",
          fontSize: 7, fontFamily: "Georgia, serif",
          color: "rgba(0,0,0,0.6)", padding: "6px 5px",
          lineHeight: 1.5, display: "flex", flexDirection: "column", gap: 2,
        }}>
          <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.12)", marginBottom: 3 }} />
          <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.12)", marginBottom: 3 }} />
          <div style={{ height: 1, width: "60%", backgroundColor: "rgba(0,0,0,0.12)" }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVIEW SCENE — Book + Quill + Ink well + Star rating
═══════════════════════════════════════════════════════════════ */
function ReviewScene() {
  return (
    <div className="book-review-wrapper select-none">
      <div className="book-review-scene">

        {/* Ink well */}
        <div style={{
          position: "absolute", bottom: 30, left: 10,
          width: 28, height: 32,
          background: "radial-gradient(ellipse at 40% 30%, #2a1a08 0%, #0a0604 80%)",
          borderRadius: "4px 4px 8px 8px",
          boxShadow: "inset 0 -3px 8px rgba(0,0,0,0.5), 1px 2px 6px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Ink surface sheen */}
          <div style={{
            position: "absolute", top: 5, left: 4, right: 4, height: 6,
            background: "radial-gradient(ellipse, rgba(50,30,10,0.9) 30%, rgba(10,6,4,0.95) 100%)",
            borderRadius: "50%",
            boxShadow: "inset 0 1px 3px rgba(100,60,20,0.3)",
          }} />
        </div>

        {/* Flat book */}
        <div className="review-book-flat">
          {/* Book title header */}
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            fontSize: 8, letterSpacing: "0.16em", color: "rgba(203,162,88,0.85)",
            fontFamily: "Georgia, serif", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>— REVIEW —</div>

          {/* Star rating */}
          <div style={{
            position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 3,
          }}>
            {[0,1,2,3,4].map(i => (
              <svg key={i} width="11" height="11" viewBox="0 0 11 11">
                <polygon
                  points="5.5,1 6.9,4.2 10.5,4.2 7.7,6.4 8.7,10 5.5,7.9 2.3,10 3.3,6.4 0.5,4.2 4.1,4.2"
                  fill={i < 4 ? "#cba258" : "none"} stroke="#cba258" strokeWidth="0.6"
                />
              </svg>
            ))}
          </div>

          {/* Written lines — varied length for realism */}
          {[0.9, 0.85, 0.92, 0.78, 0.60].map((w, i) => (
            <div key={i} style={{
              position: "absolute", left: 18, top: 44 + i * 17,
              height: 1, width: `${w * 80}%`,
              backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 1,
            }} />
          ))}

          {/* Annotation badge */}
          <div style={{
            position: "absolute", top: 8, left: 8,
            backgroundColor: "rgba(203,162,88,0.18)",
            border: "1px solid rgba(203,162,88,0.5)",
            borderRadius: 2, padding: "2px 6px",
            fontSize: 7, color: "rgba(203,162,88,0.95)",
            fontFamily: "Georgia, serif", letterSpacing: "0.1em",
          }}>✦ 4.2</div>
        </div>

        {/* Quill */}
        <div className="review-quill" />

        {/* Ink drop */}
        <div className="review-ink-drop" />

        {/* Floating "finished reading" badge */}
        <div style={{
          position: "absolute", top: 0, left: -24,
          backgroundColor: "rgba(0,98,65,0.12)",
          border: "1px solid rgba(0,117,74,0.45)",
          borderRadius: 3, padding: "4px 8px",
          fontSize: 7, color: "rgba(0,117,74,0.9)",
          fontFamily: "Georgia, serif", letterSpacing: "0.08em",
          transform: "rotate(-4deg)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          animation: "review-badge-float 4s ease-in-out infinite",
        }}>Finished ✓</div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene3D — Carousel wrapper with crossfade and scene indicator
═══════════════════════════════════════════════════════════════ */
interface Scene3DProps {
  variant?: SceneVariant;
  interval?: number;
  showIndicator?: boolean;
}
const SCENES: SceneVariant[] = ["library", "reading", "review"];
const LABELS: Record<SceneVariant, string> = {
  library: "The Library",
  reading: "Reading Time",
  review: "Writing a Review",
};

export default function Scene3D({ variant, interval = 8000, showIndicator = true }: Scene3DProps) {
  const [active, setActive] = useState<SceneVariant>(variant ?? "library");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (variant) { setActive(variant); return; }
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActive(cur => SCENES[(SCENES.indexOf(cur) + 1) % SCENES.length]);
        setFading(false);
      }, 480);
    }, interval);
    return () => clearInterval(t);
  }, [variant, interval]);

  const scene = variant ?? active;

  return (
    <div style={{ position: "relative" }}>
      {/* Scene crossfade */}
      <div style={{ transition: "opacity 0.48s ease", opacity: fading ? 0 : 1 }}>
        {scene === "library" && <LibraryScene />}
        {scene === "reading" && <ReadingScene />}
        {scene === "review" && <ReviewScene />}
      </div>

      {/* Scene label & dot indicators */}
      {showIndicator && !variant && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 6, marginTop: 8,
        }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
            color: "var(--aged-gold)", fontFamily: "Georgia, serif", opacity: 0.75,
          }}>{LABELS[scene]}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {SCENES.map(s => (
              <div key={s} style={{
                width: s === scene ? 20 : 6, height: 4,
                borderRadius: 2,
                backgroundColor: s === scene ? "var(--aged-gold)" : "rgba(203,162,88,0.3)",
                transition: "all 0.4s ease",
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
