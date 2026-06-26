"use client";

import React, { useEffect, useState, useRef } from "react";

interface TypewriterTextProps {
  texts: string[];           // Array of strings to cycle through
  typingSpeed?: number;      // ms per character
  deletingSpeed?: number;
  pauseAfter?: number;       // ms to wait at full string
  className?: string;
  cursorChar?: string;
}

export default function TypewriterText({
  texts,
  typingSpeed = 55,
  deletingSpeed = 28,
  pauseAfter = 2400,
  className = "",
  cursorChar = "|",
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const [textIdx, setTextIdx] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  /* Blinking cursor */
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;
  const idxRef = useRef(textIdx);
  idxRef.current = textIdx;

  useEffect(() => {
    if (!texts.length) return;
    const target = texts[textIdx];

    if (phase === "typing") {
      if (displayed.length < target.length) {
        const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), typingSpeed);
        return () => clearTimeout(t);
      } else {
        setPhase("pausing");
      }
    }

    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), pauseAfter);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), deletingSpeed);
        return () => clearTimeout(t);
      } else {
        setTextIdx(i => (i + 1) % texts.length);
        setPhase("typing");
      }
    }
  }, [phase, displayed, textIdx, texts, typingSpeed, deletingSpeed, pauseAfter]);

  return (
    <span className={className}>
      {displayed}
      <span
        style={{
          opacity: cursorVisible ? 1 : 0,
          transition: "opacity 0.1s",
          fontWeight: 300,
          marginLeft: 1,
        }}
      >
        {cursorChar}
      </span>
    </span>
  );
}
