"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// Global music player — persists across route changes
// Auto-plays only after first user interaction (handled via event)
export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const a = new Audio("/backsound.mp3");
    a.loop = true;
    a.volume = 0.35;
    a.addEventListener("canplaythrough", () => setReady(true), { once: true });
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
    };
  }, []);

  // Listen for custom event dispatched by Opening screen on open
  useEffect(() => {
    const handler = () => {
      const a = audioRef.current;
      if (a && !playing) {
        a.play()
          .then(() => setPlaying(true))
          .catch(() => {});
      }
    };
    window.addEventListener("wedding:play", handler);
    return () => window.removeEventListener("wedding:play", handler);
  }, [playing]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !ready) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  }, [playing, ready]);

  return (
    <button
      onClick={toggle}
      title={playing ? "Pause musik" : "Putar musik"}
      style={{
        position: "fixed",
        bottom: 18,
        right: 18,
        zIndex: 450,
        width: 42,
        height: 42,
        borderRadius: "50%",
        border: `1px solid rgba(201,169,110,${ready ? 0.45 : 0.2})`,
        background: "rgba(8,6,4,.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: playing ? "#C9A96E" : "rgba(201,169,110,.45)",
        cursor: ready ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .35s",
        padding: 0,
      }}
    >
      {playing ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      )}
    </button>
  );
}
