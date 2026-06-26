"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
type Shape =
  | "dot" | "star" | "diamond" | "book" | "quill"
  | "openbook" | "cross" | "glow" | "glyph";

interface Trail { x: number; y: number; }

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  color: string;
  shape: Shape;
  layer: 1 | 2 | 3;
  orbit: number;
  orbitAngle: number;
  angleOffset: number;
  speedMult: number;
  glowRadius?: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  trail: Trail[];
  trailLen: number;
  pulse: number;       // current pulse phase [0–2π]
  pulseSpeed: number;
  glyph?: string;
}

/* ─────────────────────────────────────────────────────────────
   Literary glyphs
───────────────────────────────────────────────────────────── */
const GLYPHS = ["§", "¶", "ℓ", "∞", "☙", "❧", "✦", "✒", "⁋", "※"];

/* ─────────────────────────────────────────────────────────────
   Canvas draw helpers
───────────────────────────────────────────────────────────── */
function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rot: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    i === 0 ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad)
            : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.55, y);
  ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.55, y);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

function openBook(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rot: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const w = r * 2.4, h = r * 1.6;
  ctx.strokeStyle = color; ctx.lineWidth = 0.85;
  // Left page
  ctx.beginPath();
  ctx.moveTo(0, -h / 2); ctx.quadraticCurveTo(-w * 0.06, 0, 0, h / 2);
  ctx.lineTo(-w / 2, h / 2 - r * 0.18); ctx.lineTo(-w / 2, -h / 2 + r * 0.18);
  ctx.closePath(); ctx.stroke();
  // Right page
  ctx.beginPath();
  ctx.moveTo(0, -h / 2); ctx.quadraticCurveTo(w * 0.06, 0, 0, h / 2);
  ctx.lineTo(w / 2, h / 2 - r * 0.18); ctx.lineTo(w / 2, -h / 2 + r * 0.18);
  ctx.closePath(); ctx.stroke();
  // Spine
  ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2); ctx.stroke();
  // Ruled lines on right page
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -h * 0.25 + i * h * 0.18);
    ctx.lineTo(w * 0.44, -h * 0.25 + i * h * 0.18);
    ctx.globalAlpha = 0.25; ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function closedBook(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rot: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const w = r * 1.4, h = r * 1.9;
  ctx.strokeStyle = color; ctx.lineWidth = 0.85;
  ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.stroke();
  // Spine
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(-w / 2 + w * 0.16, -h / 2);
  ctx.lineTo(-w / 2 + w * 0.16, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.stroke();
  // Page edges (right side)
  ctx.beginPath(); ctx.moveTo(w / 2 - 2, -h / 2 + 3); ctx.lineTo(w / 2 - 2, h / 2 - 3);
  ctx.lineWidth = 0.4; ctx.stroke();
  ctx.restore();
}

function quill(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rot: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const h = r * 3.2;
  ctx.strokeStyle = color; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2); ctx.quadraticCurveTo(r * 0.9, -h * 0.08, 0, h / 2);
  ctx.quadraticCurveTo(-r * 0.65, -h * 0.08, 0, -h / 2);
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2); ctx.stroke();
  // Barbs
  for (let i = 0; i < 4; i++) {
    const t = -h * 0.3 + i * h * 0.15;
    ctx.beginPath(); ctx.moveTo(0, t); ctx.lineTo(r * 0.5, t + r * 0.2);
    ctx.lineWidth = 0.35; ctx.stroke(); ctx.lineWidth = 0.8;
  }
  ctx.restore();
}

function glyph(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, char: string, blur: boolean) {
  ctx.save();
  if (blur) { ctx.shadowBlur = 4; ctx.shadowColor = color; }
  ctx.font = `${r * 2.4}px Georgia, serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, x, y);
  ctx.restore();
}

function glowDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, glowR: number, color: string) {
  const base = color.substring(0, color.lastIndexOf(","));
  const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
  g.addColorStop(0, `${base}, 0.18)`);
  g.addColorStop(0.5, `${base}, 0.06)`);
  g.addColorStop(1, `${base}, 0)`);
  ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
}

/* ─────────────────────────────────────────────────────────────
   Gravity Well
───────────────────────────────────────────────────────────── */
interface GravityWell { x: number; y: number; strength: number; radius: number; }

function makeWells(W: number, H: number): GravityWell[] {
  return [
    { x: W * 0.25, y: H * 0.35, strength: 0.015, radius: 260 },
    { x: W * 0.75, y: H * 0.65, strength: 0.012, radius: 220 },
  ];
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let particles: Particle[] = [];
    let wells: GravityWell[] = [];
    const mouse = { x: -9999, y: -9999, radius: 200 };
    const easedMouse = { x: -9999, y: -9999 };

    /* Resize */
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      wells = makeWells(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener("resize", () => { resize(); init(); });
    window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

    /* Theme */
    const isDark = () =>
      document.documentElement.classList.contains("dark") || resolvedTheme === "dark" || theme === "dark";

    /* Palette */
    const palette = (dark: boolean) => dark ? {
      dots: [
        "rgba(203,162,88,0.35)", "rgba(0,117,74,0.28)", "rgba(212,184,150,0.25)",
        "rgba(255,255,255,0.12)", "rgba(139,110,60,0.30)", "rgba(100,160,120,0.22)",
      ],
      lines: "rgba(203,162,88,", lineAlpha: 0.08, mouseAlpha: 0.14,
    } : {
      dots: [
        "rgba(26,18,8,0.16)", "rgba(0,98,65,0.18)", "rgba(184,150,58,0.22)",
        "rgba(107,78,42,0.16)", "rgba(70,60,48,0.12)", "rgba(0,40,20,0.10)",
      ],
      lines: "rgba(26,18,8,", lineAlpha: 0.045, mouseAlpha: 0.08,
    };

    /* Shape picker — heavy literary bias */
    const pickShape = (): Shape => {
      const r = Math.random();
      if (r < 0.18) return "glyph";
      if (r < 0.33) return "openbook";
      if (r < 0.46) return "book";
      if (r < 0.57) return "quill";
      if (r < 0.66) return "star";
      if (r < 0.74) return "diamond";
      if (r < 0.82) return "cross";
      if (r < 0.91) return "glow";
      return "dot";
    };

    /* Init */
    const init = () => {
      particles = [];
      const W = window.innerWidth, H = window.innerHeight;
      const dark = isDark();
      const pal = palette(dark);
      const total = Math.min(Math.floor((W * H) / 16000), 80);
      const splits = [Math.floor(total * 0.2), Math.floor(total * 0.45)];

      for (let i = 0; i < total; i++) {
        const layer: 1|2|3 = i < splits[0] ? 1 : i < splits[1] ? 2 : 3;
        const lspd = layer === 1 ? 1.0 : layer === 2 ? 0.55 : 0.25;
        const lscl = layer === 1 ? 1.1 : layer === 2 ? 0.72 : 0.45;
        const shape = pickShape();

        const baseR =
          shape === "openbook" || shape === "book" ? (Math.random() * 3.5 + 4.5) * lscl
          : shape === "quill"   ? (Math.random() * 2.5 + 3.5) * lscl
          : shape === "glyph"   ? (Math.random() * 2.5 + 4) * lscl
          : shape === "star"    ? (Math.random() * 2 + 2.5) * lscl
          : shape === "glow"    ? (Math.random() * 2 + 2) * lscl
          : (Math.random() * 1.5 + 1) * lscl;

        const trailLen = shape === "glyph" ? 6 : shape === "openbook" ? 8 : layer === 1 ? 12 : layer === 2 ? 6 : 0;

        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.13 * lspd,
          vy: (Math.random() - 0.5) * 0.13 * lspd,
          radius: baseR,
          color: pal.dots[Math.floor(Math.random() * pal.dots.length)],
          shape, layer,
          orbit: (Math.random() * 0.5 + 0.1) * lspd,
          orbitAngle: Math.random() * Math.PI * 2,
          angleOffset: Math.random() * Math.PI * 2,
          speedMult: Math.random() * 0.6 + 0.4,
          glowRadius: shape === "glow" ? baseR * 4.5 : undefined,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.005,
          opacity: layer === 3 ? 0.4 + Math.random() * 0.25 : 0.65 + Math.random() * 0.3,
          trail: [],
          trailLen,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.025 + 0.01,
          glyph: shape === "glyph" ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : undefined,
        });
      }
    };
    init();

    /* Draw frame */
    const draw = () => {
      const W = window.innerWidth, H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);
      const dark = isDark();
      const pal = palette(dark);
      const time = Date.now() * 0.00032;

      /* Eased mouse */
      if (mouse.x !== -9999) {
        easedMouse.x === -9999
          ? (easedMouse.x = mouse.x, easedMouse.y = mouse.y)
          : (easedMouse.x += (mouse.x - easedMouse.x) * 0.052,
             easedMouse.y += (mouse.y - easedMouse.y) * 0.052);
      } else if (easedMouse.x !== -9999) {
        easedMouse.x += (-9999 - easedMouse.x) * 0.08;
        easedMouse.y += (-9999 - easedMouse.y) * 0.08;
        if (Math.abs(easedMouse.x + 9999) < 1) { easedMouse.x = -9999; easedMouse.y = -9999; }
      }

      /* Update & draw back→front */
      [3, 2, 1].forEach(tgt => {
        particles.filter(p => p.layer === tgt).forEach(p => {

          /* Save trail point */
          if (p.trailLen > 0) {
            p.trail.unshift({ x: p.x, y: p.y });
            if (p.trail.length > p.trailLen) p.trail.pop();
          }

          /* Orbital sinusoidal flow field */
          const flowA = Math.sin(p.x * 0.003 + time + p.angleOffset) *
                        Math.cos(p.y * 0.003 + time * 0.75) * Math.PI * 1.3;
          const ff = 0.025 * p.speedMult * p.orbit;
          p.vx += Math.cos(flowA) * ff * 0.1;
          p.vy += Math.sin(flowA) * ff * 0.1;

          /* Orbital curl */
          p.orbitAngle += 0.0025 * p.orbit;
          p.vx += Math.cos(p.orbitAngle) * 0.004 * p.orbit;
          p.vy += Math.sin(p.orbitAngle) * 0.004 * p.orbit;

          /* Gravity wells */
          wells.forEach(w => {
            const dx = p.x - w.x, dy = p.y - w.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < w.radius && d > 1) {
              const f = (w.radius - d) / w.radius * w.strength * p.speedMult;
              p.vx -= (dx / d) * f;
              p.vy -= (dy / d) * f;
            }
          });

          /* Clamp speed per layer */
          const maxSpd = p.layer === 1 ? 0.34 : p.layer === 2 ? 0.21 : 0.11;
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > maxSpd) { p.vx = (p.vx / spd) * maxSpd; p.vy = (p.vy / spd) * maxSpd; }

          p.x += p.vx; p.y += p.vy;
          p.rotation += p.rotationSpeed;
          p.pulse += p.pulseSpeed;

          /* Wrap */
          if (p.x < -40) p.x = W + 40; if (p.x > W + 40) p.x = -40;
          if (p.y < -40) p.y = H + 40; if (p.y > H + 40) p.y = -40;

          /* Mouse lens — foreground & mid only */
          if (easedMouse.x !== -9999 && p.layer < 3) {
            const dx = p.x - easedMouse.x, dy = p.y - easedMouse.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < mouse.radius) {
              d > 70
                ? (p.x -= (dx / d) * ((mouse.radius - d) / mouse.radius) * 0.18,
                   p.y -= (dy / d) * ((mouse.radius - d) / mouse.radius) * 0.18)
                : (p.x += (dx / d) * ((70 - d) / 70) * 0.32,
                   p.y += (dy / d) * ((70 - d) / 70) * 0.32);
            }
          }

          /* ── DRAW TRAIL ────────────────────────────────────── */
          if (p.trail.length > 1) {
            for (let t = 0; t < p.trail.length - 1; t++) {
              const alpha = (1 - t / p.trail.length) * 0.18 * p.opacity;
              const base = p.color.substring(0, p.color.lastIndexOf(","));
              ctx.beginPath();
              ctx.moveTo(p.trail[t].x, p.trail[t].y);
              ctx.lineTo(p.trail[t + 1].x, p.trail[t + 1].y);
              ctx.strokeStyle = `${base}, ${alpha})`;
              ctx.lineWidth = p.radius * 0.6 * (1 - t / p.trail.length);
              ctx.lineCap = "round";
              ctx.stroke();
            }
          }

          /* ── DEPTH-OF-FIELD BLUR on background layer ──── */
          if (p.layer === 3) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = p.color;
          }

          /* Pulse scale */
          const pscale = 1 + Math.sin(p.pulse) * 0.12;

          ctx.globalAlpha = p.opacity;

          /* ── DRAW SHAPE ─────────────────────────────────── */
          ctx.save();
          ctx.scale(pscale, pscale);
          const px = p.x / pscale, py = p.y / pscale;

          switch (p.shape) {
            case "star":     star(ctx, px, py, p.radius, p.color, p.rotation); break;
            case "diamond":  diamond(ctx, px, py, p.radius, p.color); break;
            case "openbook": openBook(ctx, px, py, p.radius, p.color, p.rotation); break;
            case "book":     closedBook(ctx, px, py, p.radius, p.color, p.rotation); break;
            case "quill":    quill(ctx, px, py, p.radius, p.color, p.rotation); break;
            case "glyph":    glyph(ctx, px, py, p.radius, p.color, p.glyph!, p.layer < 3); break;
            case "glow":     glowDot(ctx, px, py, p.radius, p.glowRadius!, p.color); break;
            case "cross":
              ctx.beginPath();
              ctx.strokeStyle = p.color; ctx.lineWidth = 0.9;
              ctx.moveTo(px - p.radius, py); ctx.lineTo(px + p.radius, py);
              ctx.moveTo(px, py - p.radius); ctx.lineTo(px, py + p.radius);
              ctx.stroke(); break;
            default:
              ctx.beginPath(); ctx.arc(px, py, p.radius, 0, Math.PI * 2);
              ctx.fillStyle = p.color; ctx.fill();
          }
          ctx.restore();

          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        });
      });

      /* ── CONSTELLATION LINES ──────────────────────────────── */
      const lineLimit = 112;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (p1.layer === 3) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (Math.abs(p1.layer - p2.layer) > 1) continue;
          const dx = p1.x - p2.x, dy = p1.y - p2.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < lineLimit) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${pal.lines}${((lineLimit - d) / lineLimit) * pal.lineAlpha})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
        if (easedMouse.x !== -9999 && p1.layer === 1) {
          const dx = p1.x - easedMouse.x, dy = p1.y - easedMouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < mouse.radius) {
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(easedMouse.x, easedMouse.y);
            ctx.strokeStyle = `${pal.lines}${((mouse.radius - d) / mouse.radius) * pal.mouseAlpha})`;
            ctx.lineWidth = 0.65; ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    /* Watch theme */
    const obs = new MutationObserver(() => init());
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => { cancelAnimationFrame(raf); obs.disconnect(); };
  }, [theme, resolvedTheme]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none w-full h-full bg-transparent" />
  );
}
