"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const PHOTOS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  label: [
    "Senja & Senyum",
    "Dua Jiwa",
    "Cahaya Sore",
    "Kebun Mawar",
    "Tawa Bersama",
    "Pandangan Cinta",
    "Di Tepi Pantai",
    "Sebuah Janji",
    "Berdua Saja",
    "Ketenangan",
    "Momen Kecil",
    "Kasih Sayang",
    "Hari Bahagia",
    "Bersama Selalu",
    "Kenangan Abadi",
    "Perjalanan Cinta",
    "Hangat Hati",
    "Dua Dunia",
    "Kisah Kita",
    "Selamanya",
  ][i],
  src: [
    "/gallery/img2.jpg",
    "/gallery/img3.jpg",
    "/gallery/img13.jpg",
    "/gallery/img14.jpg",
    "/gallery/img15.jpg",
    "/gallery/img7.jpg",
    "/gallery/img10.jpg",
    "/gallery/img8.jpg",
    "/gallery/img9.jpg",
    "/gallery/img11.jpg",
    "/gallery/img12.jpg",
    "/gallery/img16.jpg",
    "/gallery/img17.jpg",
    "/gallery/img18.jpg",
    "/gallery/img4.jpg",
    "/gallery/img5.jpg",
    "/gallery/img6.jpg",
    "/gallery/img19.jpg",
    "/gallery/img1.jpg",
    "/gallery/img20.jpg",
  ][i],
  crop: [
    "50% 28%",
    "42% 52%",
    "62% 48%",
    "50% 72%",
    "34% 42%",
    "66% 38%",
    "50% 18%",
    "44% 62%",
    "56% 44%",
    "50% 58%",
    "38% 34%",
    "64% 36%",
    "50% 82%",
    "42% 50%",
    "58% 50%",
    "50% 24%",
    "36% 56%",
    "64% 56%",
    "50% 66%",
    "48% 44%",
  ][i],
  filter: [
    "brightness(.9) saturate(.88) sepia(.07)",
    "brightness(.93) saturate(.92)",
    "brightness(.87) saturate(.82) sepia(.11)",
    "brightness(.91) saturate(.96)",
    "brightness(.88) saturate(.84) sepia(.06)",
    "brightness(.94) saturate(.9)",
    "brightness(.86) saturate(.8) sepia(.13)",
    "brightness(.92) saturate(.94)",
    "brightness(.89) saturate(.87) sepia(.09)",
    "brightness(.95) saturate(.91)",
    "brightness(.86) saturate(.81)",
    "brightness(.91) saturate(.86) sepia(.07)",
    "brightness(.88) saturate(.91)",
    "brightness(.93) saturate(.83)",
    "brightness(.87) saturate(.89) sepia(.09)",
    "brightness(.91) saturate(.95)",
    "brightness(.89) saturate(.81) sepia(.11)",
    "brightness(.94) saturate(.87)",
    "brightness(.86) saturate(.91) sepia(.05)",
    "brightness(.92) saturate(.85)",
  ][i],
}));

/* Mosaic layout: { cols:1|2, rows:1|2 } — 3-column grid */
// Each item: explicit [colStart, rowStart, colSpan, rowSpan]
// 3-column grid, row unit = 140px on mobile, scales up on desktop
// Carefully packed so NO cell is empty
const PLACEMENTS: [number, number, number, number][] = [
  // [colStart, rowStart, colSpan, rowSpan]  — all portrait or square, no landscape
  [1, 1, 2, 2], //  0  big 2×2    rows 1-2,   cols 1-2
  [3, 1, 1, 2], //  1  tall 1×2   rows 1-2,   col 3
  [1, 3, 1, 2], //  2  tall 1×2   rows 3-4,   col 1
  [2, 3, 1, 1], //  3  small      row 3,      col 2
  [3, 3, 1, 1], //  4  small      row 3,      col 3
  [2, 4, 1, 1], //  5  small      row 4,      col 2
  [3, 4, 1, 1], //  6  small      row 4,      col 3
  [1, 5, 1, 1], //  7  small      row 5,      col 1
  [2, 5, 1, 1], //  8  small      row 5,      col 2
  [3, 5, 1, 2], //  9  tall 1×2   rows 5-6,   col 3
  [1, 6, 1, 1], // 10  small      row 6,      col 1
  [2, 6, 1, 1], // 11  small      row 6,      col 2
  [1, 7, 1, 2], // 12  tall 1×2   rows 7-8,   col 1
  [2, 7, 2, 2], // 13  big 2×2    rows 7-8,   cols 2-3
  [1, 9, 2, 2], // 14  big 2×2    rows 9-10,  cols 1-2
  [3, 9, 1, 2], // 15  tall 1×2   rows 9-10,  col 3
  [1, 11, 1, 2], // 16  tall 1×2   rows 11-12, col 1
  [2, 11, 1, 1], // 17  small      row 11,     col 2
  [3, 11, 1, 2], // 18  tall 1×2   rows 11-12, col 3
  [2, 12, 1, 1], // 19  small      row 12,     col 2
];

/* ══════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════ */
function Lightbox({
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = PHOTOS[index];

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext]);

  // touch swipe
  const tx0 = useRef(0);

  return (
    <div
      className="lb"
      onClick={onClose}
      onTouchStart={(e) => {
        tx0.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const dx = tx0.current - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 50) {
          e.stopPropagation();
          dx > 0 ? onNext() : onPrev();
        }
      }}
    >
      {/* ── CARD — fixed width, centered, nav OUTSIDE ── */}
      <div className="lb-outer" onClick={(e) => e.stopPropagation()}>
        {/* PREV — outside card on left */}
        <button
          className="lb-arrow lb-arrow-l"
          onClick={onPrev}
          disabled={index === 0}
          aria-label="Foto sebelumnya"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* PHOTO + INFO */}
        <div className="lb-card">
          {/* image */}
          <div className="lb-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={index}
              src={photo.src}
              alt={photo.label}
              className="lb-img"
              style={{ objectPosition: photo.crop, filter: photo.filter }}
            />
            {/* L-bracket corners */}
            <span className="lbc lbc-tl" />
            <span className="lbc lbc-tr" />
            <span className="lbc lbc-bl" />
            <span className="lbc lbc-br" />
          </div>

          {/* meta */}
          <div className="lb-meta">
            <span className="lb-num">{String(index + 1).padStart(2, "0")}</span>
            <span className="lb-sep" />
            <span className="lb-label">{photo.label}</span>
            <span className="lb-sep" />
            <span className="lb-tot">/ {total}</span>
          </div>

          {/* pill progress */}
          <div className="lb-track">
            <div
              className="lb-fill"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* NEXT — outside card on right */}
        <button
          className="lb-arrow lb-arrow-r"
          onClick={onNext}
          disabled={index === total - 1}
          aria-label="Foto selanjutnya"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* CLOSE — absolute top-right of backdrop */}
      <button className="lb-close" onClick={onClose} aria-label="Tutup">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function GalleryPage() {
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hdrVis, setHdrVis] = useState(true);
  const lastY = useRef(0);

  // page-enter animation trigger
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  const onScroll = useCallback(() => {
    const y = scrollRef.current?.scrollTop ?? 0;
    setHdrVis(y < lastY.current || y < 80);
    lastY.current = y;
  }, []);

  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(
    () => setActive((p) => (p !== null ? Math.max(0, p - 1) : 0)),
    []
  );
  const next = useCallback(
    () =>
      setActive((p) => (p !== null ? Math.min(PHOTOS.length - 1, p + 1) : 0)),
    []
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        :root {
          --g:  #C9A96E;
          --gl: #F0D99A;
          --gd: #8A6E3C;
          --dk: #080604;
          --cr: #FFF8EE;
          --mu: rgba(255,240,210,.5);
        }

        html { background: var(--dk); }

        body {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          color: var(--cr);
          background: var(--dk);
          -webkit-font-smoothing: antialiased;
          overscroll-behavior: none;
        }

        /* ── PAGE ENTER ── */
        .gal-page {
          min-height: 100dvh;
          opacity: 0;
          transform: translateY(18px);
          transition: opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1);
        }
        .gal-page.in {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── SCROLL WRAP ── */
        .gal-scroll {
          height: 100dvh;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: none;
          scrollbar-width: thin;
          scrollbar-color: rgba(201,169,110,.2) transparent;
        }
        .gal-scroll::-webkit-scrollbar { width: 2px; }
        .gal-scroll::-webkit-scrollbar-track { background: transparent; }
        .gal-scroll::-webkit-scrollbar-thumb { background: rgba(201,169,110,.22); border-radius: 2px; }

        /* ── HEADER ── */
        .gal-hdr {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: max(env(safe-area-inset-top),16px) clamp(16px,4vw,40px) 14px;
          background: linear-gradient(180deg, rgba(8,6,4,.97) 72%, transparent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: transform .45s cubic-bezier(.4,0,.2,1), opacity .45s ease;
        }
        .gal-hdr.up { transform: translateY(-110%); opacity: 0; }

        .gal-hdr-left { display: flex; flex-direction: column; gap: 3px; }
        .gal-eyebrow {
          font-size: .5rem; letter-spacing: .55em;
          text-transform: uppercase; color: var(--g);
        }
        .gal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.1rem,4.5vw,1.8rem);
          font-weight: 300; letter-spacing: .07em; color: #fff;
          text-shadow: 0 2px 20px rgba(0,0,0,.8);
          line-height: 1;
        }
        .gal-title em { font-style: italic; color: var(--gl); }

        .gal-back {
          display: flex; align-items: center; gap: 7px;
          padding: .58rem 1.2rem;
          border: 1px solid rgba(201,169,110,.3);
          background: rgba(201,169,110,.06);
          color: var(--gl);
          font-family: 'Jost', sans-serif; font-size: .57rem;
          letter-spacing: .3em; text-transform: uppercase;
          cursor: pointer; border-radius: 2px;
          transition: background .35s, color .35s, border-color .35s;
          flex-shrink: 0;
        }
        .gal-back:hover { background: var(--g); color: var(--dk); border-color: var(--g); }
        .gal-back svg { transition: transform .35s; }
        .gal-back:hover svg { transform: translateX(-3px); }

        /* ── HERO ── */
        .gal-hero {
          position: relative;
          height: clamp(160px,28vh,280px);
          overflow: hidden;
        }
        .gal-hero-img {
          width:100%; height:100%; object-fit:cover;
          object-position:50% 38%;
          filter: brightness(.5) saturate(.7) sepia(.12);
          transform: scale(1.08);
          transition: transform 8s ease;
        }
        .gal-hero:hover .gal-hero-img { transform: scale(1.0); }
        .gal-hero-over {
          position: absolute; inset: 0;
          background: linear-gradient(180deg,rgba(8,6,4,.25) 0%,rgba(8,6,4,0) 35%,rgba(8,6,4,.85) 100%);
        }
        .gal-hero-txt {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: clamp(16px,4vw,36px) clamp(16px,4vw,36px);
          display: flex; align-items: flex-end; justify-content: space-between;
        }
        .gal-hero-n {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem,9vw,5rem);
          font-weight: 300; color: var(--gl); line-height: 1;
          text-shadow: 0 2px 20px rgba(0,0,0,.8);
        }
        .gal-hero-n sup {
          font-size: .32em; letter-spacing: .12em;
          color: var(--g); vertical-align: super; margin-left: 2px;
        }
        .gal-hero-sub {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(.78rem,2vw,1rem);
          font-style: italic;
          color: rgba(255,248,238,.55);
          text-align: right; max-width: 180px; line-height: 1.65;
        }

        /* ── DIVIDER ── */
        .gal-div {
          display: flex; align-items: center; gap: 14px;
          padding: clamp(14px,2.5vw,24px) clamp(14px,3.5vw,36px);
        }
        .gal-div-line { flex:1; height:1px; background: rgba(201,169,110,.13); }
        .gal-div-txt {
          font-size: .5rem; letter-spacing: .45em;
          text-transform: uppercase; color: rgba(201,169,110,.45);
          white-space: nowrap;
        }

        /* ── GRID ── */
        .gal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: clamp(120px, 18vw, 180px);
          gap: clamp(4px,1vw,7px);
          padding: 0 clamp(8px,2.5vw,20px);
          max-width: 1080px;
          margin: 0 auto;
        }
        @media (max-width: 360px) {
          .gal-grid { grid-template-columns: repeat(2,1fr); }
        }

        /* ── GRID ITEM ── */
        .gi {
          position: relative; overflow: hidden;
          border-radius: 3px; cursor: pointer; outline: none;
          background: rgba(201,169,110,.04);
        }
        /* stagger entrance */
        .gi { animation: giIn .55s ease both; }
        @keyframes giIn {
          from { opacity:0; transform:translateY(14px) scale(.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        .gi-img {
          width:100%; height:100%; object-fit:cover; display:block;
          transition: transform .65s cubic-bezier(.4,0,.2,1);
          will-change: transform;
        }
        .gi:hover .gi-img, .gi:focus-visible .gi-img { transform: scale(1.07); }

        /* overlay darkens on hover */
        .gi-ov {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg,rgba(8,6,4,0) 45%,rgba(8,6,4,.65) 100%);
          opacity: .6;
          transition: opacity .4s ease;
        }
        .gi:hover .gi-ov, .gi:focus-visible .gi-ov { opacity: 1; }

        /* gold top line — slides in on hover */
        .gi-line {
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, var(--g) 50%, transparent 100%);
          transform: scaleX(0);
          transition: transform .4s cubic-bezier(.4,0,.2,1);
          pointer-events: none;
          transform-origin: center;
        }
        .gi:hover .gi-line, .gi:focus-visible .gi-line { transform: scaleX(1); }

        /* info panel */
        .gi-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 8px 10px 7px;
          display: flex; align-items: center; justify-content: space-between;
          transform: translateY(5px); opacity: 0;
          transition: transform .35s ease, opacity .35s ease;
          pointer-events: none;
        }
        .gi:hover .gi-info, .gi:focus-visible .gi-info {
          transform: translateY(0); opacity: 1;
        }
        .gi-lbl {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(.55rem,1.6vw,.74rem);
          font-style: italic; color: rgba(255,248,238,.88);
          text-shadow: 0 1px 8px rgba(0,0,0,.95);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .gi-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: .46rem; letter-spacing: .18em;
          color: rgba(201,169,110,.55);
          flex-shrink: 0; margin-left: 5px;
        }

        /* focus ring */
        .gi:focus-visible {
          box-shadow: 0 0 0 2px var(--g), 0 0 0 4px rgba(201,169,110,.2);
        }

        /* wide items: gold left accent */
        .gi.wide::before {
          content:'';
          position:absolute; bottom:0; left:0;
          width:2px; height:35%;
          background: linear-gradient(180deg,transparent,var(--g));
          pointer-events:none;
          z-index:1;
        }

        /* ── FOOTER ── */
        .gal-foot {
          padding: clamp(36px,7vw,64px) clamp(16px,4vw,40px) max(env(safe-area-inset-bottom),44px);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          text-align: center;
        }
        .gal-foot-sh {
          width:60px; height:1px;
          background: linear-gradient(90deg,transparent,var(--g),transparent);
        }
        .gal-foot-q {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(.85rem,2.2vw,1.05rem);
          font-style: italic; color: rgba(255,248,238,.3);
          max-width: 340px; line-height: 1.8;
        }
        .gal-foot-nm {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.4rem,4.5vw,2rem);
          font-weight: 300; letter-spacing: .12em;
          color: rgba(201,169,110,.45);
        }
        .gal-foot-nm em { font-style: italic; }
        .gal-foot-dt {
          font-size: .5rem; letter-spacing: .42em;
          text-transform: uppercase; color: rgba(201,169,110,.28);
        }

        /* ══════════════════════════
           LIGHTBOX
        ══════════════════════════ */
        .lb {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(4,3,2,.96);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: max(env(safe-area-inset-top),60px) clamp(48px,8vw,80px) max(env(safe-area-inset-bottom),60px);
          animation: lbFadeIn .22s ease both;
        }
        @keyframes lbFadeIn { from{opacity:0} to{opacity:1} }

        /* outer row: [arrow] [card] [arrow] */
        .lb-outer {
          display: flex;
          align-items: center;
          gap: clamp(10px,3vw,28px);
          width: 100%;
          max-width: min(540px, 96vw);
          animation: lbSlide .28s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes lbSlide {
          from { opacity:0; transform:scale(.96) translateY(12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }

        /* ← → arrow buttons — OUTSIDE the card */
        .lb-arrow {
          flex-shrink: 0;
          width: 42px; height: 42px; border-radius: 50%;
          border: 1px solid rgba(201,169,110,.25);
          background: rgba(8,6,4,.75);
          color: var(--gl);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all .3s;
          backdrop-filter: blur(8px);
        }
        .lb-arrow:hover:not(:disabled) {
          border-color: var(--g);
          background: rgba(201,169,110,.14);
          color: var(--g);
          transform: scale(1.08);
        }
        .lb-arrow:disabled { opacity: .2; cursor: default; }

        /* card — middle */
        .lb-card {
          flex: 1;
          display: flex; flex-direction: column; gap: 14px;
          min-width: 0;
        }

        .lb-frame {
          position: relative;
          border-radius: 3px; overflow: hidden;
          border: 1px solid rgba(201,169,110,.16);
          box-shadow: 0 20px 60px rgba(0,0,0,.75);
        }
        .lb-img {
          width: 100%; display: block;
          aspect-ratio: 3/4; object-fit: cover;
          animation: lbImgIn .3s ease both;
        }
        @keyframes lbImgIn {
          from { opacity:0; transform:scale(.98); }
          to   { opacity:1; transform:scale(1); }
        }

        /* L-bracket corners */
        .lbc {
          position: absolute;
          width: 18px; height: 18px;
          pointer-events: none;
        }
        .lbc-tl { top:0; left:0;   border-top:1px solid var(--g); border-left:1px solid var(--g); }
        .lbc-tr { top:0; right:0;  border-top:1px solid var(--g); border-right:1px solid var(--g); }
        .lbc-bl { bottom:0; left:0;  border-bottom:1px solid var(--g); border-left:1px solid var(--g); }
        .lbc-br { bottom:0; right:0; border-bottom:1px solid var(--g); border-right:1px solid var(--g); }

        .lb-meta {
          display: flex; align-items: center;
          justify-content: center; gap: 9px;
        }
        .lb-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: .95rem; font-weight: 300;
          color: var(--gl); letter-spacing: .1em;
        }
        .lb-sep {
          width: 1px; height: 10px;
          background: rgba(201,169,110,.28);
          flex-shrink: 0;
        }
        .lb-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: .8rem; font-style: italic;
          color: rgba(255,248,238,.62); letter-spacing: .05em;
        }
        .lb-tot {
          font-family: 'Cormorant Garamond', serif;
          font-size: .75rem; color: rgba(201,169,110,.4);
        }

        /* thin progress bar */
        .lb-track {
          height: 2px;
          background: rgba(201,169,110,.12);
          border-radius: 1px;
          overflow: hidden;
        }
        .lb-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gd), var(--g), var(--gl));
          border-radius: 1px;
          transition: width .35s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 0 6px var(--g);
        }

        /* close button */
        .lb-close {
          position: absolute; top: 16px; right: 16px;
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(201,169,110,.25);
          background: rgba(8,6,4,.85);
          color: rgba(201,169,110,.65);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .3s; z-index: 5;
        }
        .lb-close:hover {
          border-color: var(--g); color: var(--g);
          background: rgba(201,169,110,.12);
          transform: rotate(90deg) scale(1.1);
        }
      `}</style>

      <div className={`gal-page${entered ? " in" : ""}`}>
        <div className="gal-scroll" ref={scrollRef} onScroll={onScroll}>
          {/* HEADER */}
          <header className={`gal-hdr${hdrVis ? "" : " up"}`}>
            <div className="gal-hdr-left">
              <p className="gal-eyebrow">Galeri Foto</p>
              <h1 className="gal-title">
                Ais <em>&amp;</em> Tangkas
              </h1>
            </div>
            <button className="gal-back" onClick={() => router.push("/")}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Kembali
            </button>
          </header>

          {/* HERO */}
          <div className="gal-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/couple.jpg" alt="" className="gal-hero-img" />
            <div className="gal-hero-over" />
            <div className="gal-hero-txt">
              <p className="gal-hero-n">
                20<sup>foto</sup>
              </p>
              <p className="gal-hero-sub">
                Setiap gambar menyimpan
                <br />
                kenangan tak ternilai
              </p>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="gal-div">
            <span className="gal-div-line" />
            <span className="gal-div-txt">Koleksi Foto</span>
            <span className="gal-div-line" />
          </div>

          {/* GRID */}
          <div className="gal-grid">
            {PHOTOS.map((photo, i) => {
              const [cs, rs, csp, rsp] = PLACEMENTS[i];
              const isWide = csp >= 2;
              return (
                <div
                  key={photo.id}
                  className={`gi${isWide ? " wide" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Foto ${i + 1}: ${photo.label}`}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && setActive(i)
                  }
                  style={{
                    gridColumn: `${cs} / span ${csp}`,
                    gridRow: `${rs} / span ${rsp}`,
                    animationDelay: `${Math.min(i * 0.045, 0.6)}s`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.label}
                    className="gi-img"
                    loading={i < 6 ? "eager" : "lazy"}
                    style={{ objectPosition: photo.crop, filter: photo.filter }}
                  />
                  <div className="gi-ov" />
                  <div className="gi-line" />
                  <div className="gi-info">
                    <span className="gi-lbl">{photo.label}</span>
                    <span className="gi-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER */}
          <footer className="gal-foot">
            <div className="gal-foot-sh" />
            <p className="gal-foot-q">
              "Setiap foto adalah kenangan,
              <br />
              setiap kenangan adalah harta."
            </p>
            <p className="gal-foot-nm">
              Ais <em>&amp;</em> Tangkas
            </p>
            <p className="gal-foot-dt">07 Juni 2026</p>
            <div className="gal-foot-sh" />
          </footer>
        </div>
      </div>

      {/* LIGHTBOX */}
      {active !== null && (
        <Lightbox
          index={active}
          total={PHOTOS.length}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}
