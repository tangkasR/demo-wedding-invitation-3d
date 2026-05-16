"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageTransition } from "./components/PageTransition";

/* ════════════════════════════════════════════
   SCENE ORDER (scroll cinematic)
   0  Hero
   1  Mempelai Pria
   2  Mempelai Wanita
   3  Ar-Rum Quote
   4  Kisah Cinta        ← after quote
   5  Info Resepsi
   6  Hitung Mundur
   7  Penutup
   ── then Gallery opens as its own page ──
════════════════════════════════════════════ */

const TOTAL = 8;

const SCENE_LABELS = [
  "01 · Pembuka",
  "02 · Mempelai Pria",
  "03 · Mempelai Wanita",
  "04 · Kutipan",
  "05 · Kisah Cinta",
  "06 · Resepsi",
  "07 · Hitung Mundur",
  "08 · Penutup",
];

// camera: panX%, panY%, scale, brightness, saturation, blurPx, cinematic-bar-height
const CAM = [
  { x: 0, y: 0, s: 1.0, br: 0.7, sat: 0.8, bl: 0, bar: 0 }, // 0 Hero
  { x: -8, y: 6, s: 1.58, br: 0.8, sat: 0.9, bl: 0, bar: 65 }, // 1 Groom
  { x: 8, y: 6, s: 1.58, br: 0.8, sat: 0.9, bl: 0, bar: 65 }, // 2 Bride
  { x: 0, y: 3, s: 1.18, br: 0.65, sat: 0.76, bl: 0, bar: 75 }, // 3 Quote
  { x: 2, y: 4, s: 1.22, br: 0.52, sat: 0.72, bl: 6, bar: 85 }, // 4 Story
  { x: 0, y: -6, s: 1.4, br: 0.46, sat: 0.62, bl: 5, bar: 90 }, // 5 Event
  { x: 0, y: 0, s: 1.1, br: 0.5, sat: 0.68, bl: 3, bar: 80 }, // 6 Countdown
  { x: 0, y: 0, s: 0.96, br: 0.58, sat: 0.72, bl: 2, bar: 55 }, // 7 Closing
];

/* ── helpers ── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
function getCD() {
  const d = Math.max(
    0,
    new Date("2026-06-07T11:00:00+07:00").getTime() - Date.now()
  );
  return {
    d: pad(d / 86400000),
    h: pad((d % 86400000) / 3600000),
    m: pad((d % 3600000) / 60000),
    s: pad((d % 60000) / 1000),
  };
}

/* ── shared design tokens ── */
const G = "var(--gold)";
const GL = "var(--gold-l)";
const MUT = "var(--muted)";
const TH = "0 2px 30px rgba(0,0,0,.96), 0 4px 60px rgba(0,0,0,.85)";
const TS = "0 1px 14px rgba(0,0,0,.88)";
const TG = "0 2px 20px rgba(0,0,0,.92), 0 0 40px rgba(201,169,110,.28)";

/* ── tiny shared components ── */
const Shimmer = ({ w = 70 }: { w?: number }) => (
  <div
    style={{
      width: w,
      height: 1,
      background: "linear-gradient(90deg,transparent,var(--gold),transparent)",
    }}
  />
);
const Lbl = ({
  c = G,
  children,
}: {
  c?: string;
  children: React.ReactNode;
}) => (
  <p
    style={{
      fontSize: "0.55rem",
      letterSpacing: "0.52em",
      textTransform: "uppercase",
      color: c,
    }}
  >
    {children}
  </p>
);
const Glass = ({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      background: "rgba(8,6,4,.65)",
      border: "1px solid rgba(201,169,110,.22)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      borderRadius: 3,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ════════════════════════════════════════════
   OVERLAY WRAPPER
════════════════════════════════════════════ */
function Ov({
  show,
  children,
  cx = false,
  style = {},
  classname,
}: {
  show: boolean;
  children: React.ReactNode;
  cx?: boolean;
  style?: React.CSSProperties;
  classname?: string;
}) {
  return (
    <div
      className={classname}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        pointerEvents: "none", // never block scroll
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(14px)",
        transition: "opacity .65s ease, transform .65s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: cx ? "center" : undefined,
        justifyContent: cx ? "center" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════
   SCENE 0 — HERO
════════════════════════════════════════════ */
function HeroOv({ show }: { show: boolean }) {
  return (
    <Ov
      show={show}
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: "12vh",
      }}
    >
      <h1
        style={{
          fontFamily: "'Cormorant Garamond',serif",

          fontWeight: 300,
          letterSpacing: ".1em",
          lineHeight: 0.95,
          color: "#fff",
          textAlign: "center",
          textShadow: TH,
        }}
        className="text-3xl md:text-[80px]"
      >
        Ais <em style={{ fontStyle: "italic", color: GL }}>&amp;</em> Tangkas
      </h1>
      <p
        style={{
          marginTop: "1rem",

          letterSpacing: ".42em",
          textTransform: "uppercase",
          color: G,
          textShadow: TS,
        }}
        className="text-[8px] md:text-base"
      >
        07 · Juni · 2026
      </p>
      <div
        className="anim-bob"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginTop: 32,
        }}
      >
        <div
          style={{
            width: 1,
            height: 42,
            background: "linear-gradient(180deg,var(--gold),transparent)",
          }}
        />
        <span
          style={{
            fontSize: ".54rem",
            letterSpacing: ".35em",
            textTransform: "uppercase",
            color: G,
            opacity: 0.8,
          }}
        >
          Scroll
        </span>
      </div>
    </Ov>
  );
}

/* ════════════════════════════════════════════
   SCENE 1 — GROOM
════════════════════════════════════════════ */
function GroomOv({ show }: { show: boolean }) {
  return (
    <Ov
      show={show}
      style={{
        justifyContent: "center",
        padding: "0 5vw",
      }}
      classname="items-end md:items-start"
    >
      <Glass
        style={{
          padding: "clamp(1.2rem,5vw,2rem) clamp(1.4rem,5vw,2.2rem)",
          maxWidth: "min(310px,84vw)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 1,
            background: "linear-gradient(90deg,var(--gold),transparent)",
            marginBottom: "1.2rem",
          }}
        />
        <Lbl>Mempelai Pria</Lbl>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(1.9rem,8vw,2.9rem)",
            fontWeight: 300,
            lineHeight: 1.1,
            color: "#fff",
            textShadow: TH,
            marginTop: ".7rem",
            marginBottom: ".8rem",
          }}
        >
          <em style={{ fontStyle: "italic", color: GL }}>Tangkas</em>
        </h2>
        <Lbl c={`${G}cc`}>Putra dari</Lbl>
        <p
          style={{
            marginTop: ".4rem",
            fontSize: ".84rem",
            lineHeight: 1.9,
            color: "rgba(255,248,238,.88)",
            textShadow: TS,
          }}
        >
          Bapak
          <br />
          Ibu
        </p>
      </Glass>
    </Ov>
  );
}

/* ════════════════════════════════════════════
   SCENE 2 — BRIDE
════════════════════════════════════════════ */
function BrideOv({ show }: { show: boolean }) {
  return (
    <Ov
      show={show}
      style={{
        justifyContent: "center",
        padding: "0 5vw",
      }}
      classname="items-start md:items-end"
    >
      <Glass
        style={{
          padding: "clamp(1.2rem,5vw,2rem) clamp(1.4rem,5vw,2.2rem)",
          maxWidth: "min(310px,84vw)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 1,
            background: "linear-gradient(90deg,var(--gold),transparent)",
            marginBottom: "1.2rem",
          }}
        />
        <Lbl>Mempelai Wanita</Lbl>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(1.9rem,8vw,2.9rem)",
            fontWeight: 300,
            lineHeight: 1.1,
            color: "#fff",
            textShadow: TH,
            marginTop: ".7rem",
            marginBottom: ".8rem",
          }}
        >
          <em style={{ fontStyle: "italic", color: GL }}>Ais</em>
        </h2>
        <Lbl c={`${G}cc`}>Putri dari</Lbl>
        <p
          style={{
            marginTop: ".4rem",
            fontSize: ".84rem",
            lineHeight: 1.9,
            color: "rgba(255,248,238,.88)",
            textShadow: TS,
          }}
        >
          Bapak
          <br />
          Ibu
        </p>
      </Glass>
    </Ov>
  );
}

/* ════════════════════════════════════════════
   SCENE 3 — AR-RUM QUOTE
════════════════════════════════════════════ */
function QuoteOv({ show }: { show: boolean }) {
  return (
    <Ov show={show} cx style={{ gap: 20, padding: "0 8vw" }}>
      <Shimmer />
      <p
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: "clamp(1.05rem,4.2vw,1.5rem)",
          fontStyle: "italic",
          fontWeight: 300,
          lineHeight: 1.88,
          maxWidth: 560,
          color: "#fff",
          textAlign: "center",
          textShadow: TH,
        }}
      >
        "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu
        isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa
        tenteram kepadanya."
      </p>
      <Lbl>— Ar-Rum: 21</Lbl>
      <Shimmer />
    </Ov>
  );
}

/* ════════════════════════════════════════════
   SCENE 4 — KISAH CINTA (after quote)
════════════════════════════════════════════ */
const CHAPTERS = [
  {
    year: "Awal",
    title: "Pertemuan Pertama",
    body: "Kami pertama kali bertemu pada suatu hari yang menyenangkan, diperkenalkan oleh seorang teman, dan apa yang dimulai sebagai percakapan sederhana segera mengalir dengan begitu alami. Dari obrolan ringan, berubah menjadi tawa yang kami harap tak pernah berakhir.",
  },
  {
    year: "Perjalanan",
    title: "Bersama Melewati Segalanya",
    body: "Seiring berjalannya waktu, kami melewati berbagai momen, baik suka maupun duka, bersama. Kami saling belajar, berbagi begitu banyak kenangan, dan selalu memberikan dukungan tanpa henti satu sama lain.",
  },
  {
    year: "2026",
    title: "Babak Baru",
    body: "Kini, kami siap melangkah ke tahap berikutnya dan memulai babak baru dalam kehidupan kami bersama. Dengan penuh kebahagiaan, kami mengundang Anda untuk turut merayakan momen istimewa ini pada 7 Juni 2026.",
  },
];

// Shared ref so SnapScroller can read & set story chapter index
const storyIdxRef = { current: 0 };

function StoryOv({ show }: { show: boolean }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  // Keep shared ref in sync
  useEffect(() => {
    storyIdxRef.current = idx;
  }, [idx]);

  // Reset to chapter 0 when scene becomes active again
  useEffect(() => {
    if (!show) {
      storyIdxRef.current = 0;
      setIdx(0);
      setFade(true);
    }
  }, [show]);

  // Listen for external chapter change (from SnapScroller)
  useEffect(() => {
    const handler = (e: Event) => {
      const dir = (e as CustomEvent<1 | -1>).detail;
      setFade(false);
      setTimeout(() => {
        setIdx((p) => Math.max(0, Math.min(CHAPTERS.length - 1, p + dir)));
        setFade(true);
      }, 260);
    };
    const reset = () => {
      setFade(false);
      setTimeout(() => {
        setIdx(0);
        setFade(true);
      }, 200);
    };
    window.addEventListener("story:step", handler);
    window.addEventListener("story:reset", reset);
    return () => {
      window.removeEventListener("story:step", handler);
      window.removeEventListener("story:reset", reset);
    };
  }, []);

  const ch = CHAPTERS[idx];

  return (
    <Ov show={show} cx style={{ padding: "0 5vw", pointerEvents: "none" }}>
      <div
        style={{
          width: "100%",
          maxWidth: "min(480px,92vw)",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <Shimmer w={50} />
          <Lbl>Kisah Cinta</Lbl>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "clamp(1.8rem,7vw,2.6rem)",
              fontWeight: 300,
              color: "#fff",
              letterSpacing: ".06em",
              textShadow: TH,
              textAlign: "center",
            }}
          >
            Ais <em style={{ fontStyle: "italic", color: GL }}>&amp;</em>{" "}
            Tangkas
          </h2>
          <Shimmer w={50} />
        </div>

        {/* chapter progress dots — display only */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {CHAPTERS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 22 : 6,
                height: 6,
                borderRadius: 3,
                background: i === idx ? G : "rgba(201,169,110,.28)",
                transition: "all .4s ease",
              }}
            />
          ))}
        </div>

        {/* card */}
        <Glass
          style={{
            padding: "clamp(1.3rem,5vw,1.8rem) clamp(1.4rem,5vw,2rem)",
            opacity: fade ? 1 : 0,
            transform: fade ? "translateY(0)" : "translateY(8px)",
            transition: "opacity .26s ease, transform .26s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ width: 26, height: 1, background: G }} />
            <span
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: ".78rem",
                letterSpacing: ".35em",
                color: G,
              }}
            >
              {ch.year}
            </span>
          </div>
          <h3
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "clamp(1.3rem,5vw,1.7rem)",
              fontWeight: 300,
              color: "#fff",
              textShadow: TH,
              marginBottom: 10,
              lineHeight: 1.2,
            }}
          >
            {ch.title}
          </h3>
          <p
            style={{
              fontSize: "clamp(.8rem,3vw,.9rem)",
              lineHeight: 1.9,
              color: "rgba(255,248,238,.78)",
              textShadow: TS,
            }}
          >
            {ch.body}
          </p>
        </Glass>

        {/* scroll hint */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            marginTop: 20,
            opacity: 0.5,
          }}
        >
          <div
            style={{
              width: 20,
              height: 1,
              background: "linear-gradient(90deg,transparent,var(--gold))",
            }}
          />
          <span
            style={{
              fontSize: ".5rem",
              letterSpacing: ".35em",
              textTransform: "uppercase",
              color: G,
            }}
          >
            {idx < CHAPTERS.length - 1
              ? "Scroll untuk lanjut"
              : "Scroll untuk resepsi"}
          </span>
          <div
            style={{
              width: 20,
              height: 1,
              background: "linear-gradient(90deg,var(--gold),transparent)",
            }}
          />
        </div>
      </div>
    </Ov>
  );
}

/* ════════════════════════════════════════════
   SCENE 5 — EVENT
════════════════════════════════════════════ */
function EventOv({ show }: { show: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Ov
      show={show}
      cx
      style={{ padding: "0 5vw", pointerEvents: show ? "auto" : "none" }}
    >
      <Glass
        style={{
          width: "100%",
          maxWidth: "min(420px,92vw)",
          padding: "clamp(1.4rem,6vw,2.2rem) clamp(1.5rem,6vw,2.5rem)",
        }}
      >
        <div
          style={{
            width: 50,
            height: 1,
            background: "linear-gradient(90deg,var(--gold),transparent)",
            marginBottom: "1.3rem",
          }}
        />
        <p
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: ".74rem",
            letterSpacing: ".5em",
            textTransform: "uppercase",
            color: G,
            marginBottom: "1.3rem",
          }}
        >
          Resepsi Pernikahan
        </p>
        {[
          { l: "Tanggal", v: "Minggu, 7 Juni 2026" },
          { l: "Waktu", v: "11.00 – 13.30 WIB" },
          {
            l: "Lokasi",
            v: "Kediaman Mempelai Wanita",
            s: "Indonesia",
          },
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            <p
              style={{
                fontSize: ".52rem",
                letterSpacing: ".45em",
                textTransform: "uppercase",
                color: MUT,
                marginBottom: ".22rem",
              }}
            >
              {r.l}
            </p>
            <p
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: "clamp(1.1rem,4.5vw,1.4rem)",
                fontWeight: 300,
                color: "#fff",
                textShadow: TS,
              }}
            >
              {r.v}
              {r.s && (
                <>
                  <br />
                  <span style={{ fontSize: "1rem", color: MUT }}>{r.s}</span>
                </>
              )}
            </p>
            {i < 2 && (
              <div
                style={{
                  width: 28,
                  height: 1,
                  background: "rgba(201,169,110,.18)",
                  marginTop: ".9rem",
                }}
              />
            )}
          </div>
        ))}
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            marginTop: "1.4rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: ".76rem 1.4rem",
            border: "1px solid rgba(201,169,110,.52)",
            color: hov ? "var(--dark)" : GL,
            background: hov ? G : "transparent",
            fontFamily: "'Jost',sans-serif",
            fontSize: ".62rem",
            letterSpacing: ".3em",
            textTransform: "uppercase",
            textDecoration: "none",
            borderRadius: 2,
            transition: "all .35s",
            cursor: "pointer",
            pointerEvents: show ? "auto" : "none",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          Buka Google Maps
        </a>
      </Glass>
    </Ov>
  );
}

/* ════════════════════════════════════════════
   SCENE 6 — COUNTDOWN
════════════════════════════════════════════ */
function CountdownOv({ show }: { show: boolean }) {
  const [t, setT] = useState(getCD());
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setT(getCD()), 1000);
    return () => clearInterval(id);
  }, [show]);
  const units = [
    { v: t.d, l: "Hari" },
    { v: t.h, l: "Jam" },
    { v: t.m, l: "Menit" },
    { v: t.s, l: "Detik" },
  ];
  return (
    <Ov show={show} cx style={{ gap: 24, padding: "0 6vw" }}>
      <Lbl>Menghitung Hari Bahagia</Lbl>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "clamp(10px,3vw,28px)",
        }}
      >
        {units.map((u, i) => (
          <div
            key={u.l}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "clamp(10px,3vw,28px)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: "clamp(2.8rem,12vw,5rem)",
                  fontWeight: 300,
                  color: "#fff",
                  lineHeight: 1,
                  minWidth: "2ch",
                  textAlign: "center",
                  textShadow: "0 2px 20px rgba(0,0,0,.9)",
                }}
              >
                {u.v}
              </span>
              <span
                style={{
                  fontSize: ".52rem",
                  letterSpacing: ".35em",
                  textTransform: "uppercase",
                  color: G,
                  opacity: 0.8,
                }}
              >
                {u.l}
              </span>
            </div>
            {i < 3 && (
              <span
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: "clamp(2rem,8vw,3.5rem)",
                  color: G,
                  opacity: 0.38,
                  paddingTop: ".3rem",
                }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
      <p
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: ".95rem",
          fontStyle: "italic",
          color: "rgba(255,248,238,.4)",
          letterSpacing: ".08em",
        }}
      >
        07 Juni 2026 · 11.00 WIB
      </p>
    </Ov>
  );
}

/* ════════════════════════════════════════════
   SCENE 7 — CLOSING
════════════════════════════════════════════ */
function ClosingOv({ show }: { show: boolean }) {
  const [hov, setHov] = useState(false);
  const navigate = usePageTransition();
  return (
    <Ov
      show={show}
      cx
      style={{
        gap: 22,
        padding: "0 8vw",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      <Shimmer w={70} />
      <Lbl c={`${G}cc`}>Dengan penuh cinta</Lbl>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: "clamp(2.8rem,12vw,5.5rem)",
          fontWeight: 300,
          letterSpacing: ".12em",
          color: GL,
          textAlign: "center",
          textShadow:
            "0 0 80px rgba(201,169,110,.35), 0 2px 30px rgba(0,0,0,.85)",
        }}
      >
        Ais &amp; Tangkas
      </h2>
      <p
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: "clamp(.95rem,3.5vw,1.2rem)",
          fontStyle: "italic",
          color: "rgba(255,248,238,.58)",
          textAlign: "center",
          maxWidth: 380,
          lineHeight: 1.88,
        }}
      >
        Kehadiran Bapak / Ibu / Saudara/i adalah doa dan berkah terbesar bagi
        kami
      </p>
      <Shimmer w={70} />

      {/* Gallery button */}
      <button
        onClick={() => navigate("/gallery")}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: ".82rem 2rem",
          border: "1px solid rgba(201,169,110,.52)",
          background: hov ? G : "transparent",
          color: hov ? "var(--dark)" : GL,
          fontFamily: "'Jost',sans-serif",
          fontSize: ".65rem",
          letterSpacing: ".32em",
          textTransform: "uppercase",
          cursor: "pointer",
          borderRadius: 2,
          transition: "all .35s",
          pointerEvents: show ? "auto" : "none",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
        Lihat Galeri Foto
      </button>

      <Lbl c="rgba(201,169,110,.38)">7 Juni 2026</Lbl>
    </Ov>
  );
}

/* ════════════════════════════════════════════
   PHOTO WORLD + CAMERA LERP
════════════════════════════════════════════ */
function PhotoWorld({ scene }: { scene: number }) {
  const worldRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const barTRef = useRef<HTMLDivElement>(null);
  const barBRef = useRef<HTMLDivElement>(null);
  const cam = useRef({ x: 0, y: 0, s: 1, br: 0.7, sat: 0.8, bl: 0 });
  const tgt = useRef({ ...CAM[0] });
  const scRef = useRef(scene);

  useEffect(() => {
    scRef.current = scene;
    tgt.current = { ...CAM[scene] };
  }, [scene]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const c = cam.current,
        t = tgt.current,
        sp = 0.052;
      c.x = lerp(c.x, t.x, sp);
      c.y = lerp(c.y, t.y, sp);
      c.s = lerp(c.s, t.s, sp);
      c.br = lerp(c.br, t.br, sp);
      c.sat = lerp(c.sat, t.sat, sp);
      c.bl = lerp(c.bl, t.bl, sp);
      if (worldRef.current)
        worldRef.current.style.transform = `translate(${c.x}%,${c.y}%) scale(${c.s})`;
      if (imgRef.current) {
        const bl = c.bl > 0.12 ? ` blur(${c.bl.toFixed(2)}px)` : "";
        imgRef.current.style.filter = `brightness(${c.br.toFixed(
          3
        )}) saturate(${c.sat.toFixed(3)}) sepia(.09)${bl}`;
      }
      const bh = CAM[scRef.current].bar;
      if (barTRef.current) barTRef.current.style.height = `${bh}px`;
      if (barBRef.current) barBRef.current.style.height = `${bh}px`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div
        ref={barTRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "var(--dark)",
          height: 0,
          transition: "height .9s cubic-bezier(.4,0,.2,1)",
          pointerEvents: "none",
        }}
      />
      <div
        ref={barBRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "var(--dark)",
          height: 0,
          transition: "height .9s cubic-bezier(.4,0,.2,1)",
          pointerEvents: "none",
        }}
      />
      <div
        ref={worldRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: "0",
          left: "0",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="/background.png"
          className="h-full w-full"
          alt="Ais & Tangkas"
          style={{
            objectFit: "cover",
            display: "block",
            willChange: "filter",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center,transparent 18%,rgba(8,6,4,.74) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg,rgba(8,6,4,.38) 0%,transparent 28%,transparent 72%,rgba(8,6,4,.58) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   PARTICLES
════════════════════════════════════════════ */
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current!;
    const ctx = cvs.getContext("2d")!;
    let W = 0,
      H = 0,
      raf = 0;
    const resize = () => {
      W = cvs.width = innerWidth;
      H = cvs.height = innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    type P = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      a: number;
      gold: boolean;
      life: number;
      max: number;
    };
    const mk = (init = true): P => ({
      x: Math.random() * W,
      y: init ? Math.random() * H : H + 5,
      r: Math.random() * 1.3 + 0.28,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(Math.random() * 0.44 + 0.11),
      a: Math.random() * 0.48 + 0.1,
      gold: Math.random() > 0.44,
      life: 0,
      max: Math.random() * 500 + 200,
    });
    const pts = Array.from({ length: 100 }, () => mk(true));
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.y < -8 || p.life > p.max) Object.assign(p, mk(false));
        const a = Math.sin((p.life / p.max) * Math.PI) * p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(201,169,110,${a})`
          : `rgba(255,248,238,${a * 0.38})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
    />
  );
}

/* ════════════════════════════════════════════
   DOT NAV
════════════════════════════════════════════ */
function DotNav({
  scene,
  onDot,
}: {
  scene: number;
  onDot: (i: number) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 400,
        display: "flex",
        flexDirection: "column",
        gap: 13,
      }}
    >
      {Array.from({ length: TOTAL }, (_, i) => (
        <button
          key={i}
          onClick={() => onDot(i)}
          title={SCENE_LABELS[i]}
          className={i === scene ? "anim-pulse" : ""}
          style={{
            width: i === scene ? 8 : 5,
            height: i === scene ? 8 : 5,
            borderRadius: "50%",
            border: `1px solid ${i === scene ? G : "rgba(201,169,110,.38)"}`,
            background: i === scene ? G : "transparent",
            padding: 0,
            cursor: "pointer",
            transition: "all .4s ease",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   SNAP SCROLLER — wheel + touch on window
   scroll container is hidden, pointer-events:none
════════════════════════════════════════════ */
const STORY_SCENE = 4; // which scene index is the story

function SnapScroller({
  onScene,
  scrollRef,
}: {
  onScene: (i: number) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const sceneRef = useRef(0);
  const coolRef = useRef(false);

  const goTo = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(TOTAL - 1, i));
      if (idx === sceneRef.current) return;
      sceneRef.current = idx;
      onScene(idx);
      if (scrollRef.current) scrollRef.current.scrollTop = idx * innerHeight;
    },
    [onScene, scrollRef]
  );

  // Core scroll handler — intercepts story scene to step chapters first
  const handleScroll = useCallback(
    (dir: 1 | -1) => {
      if (coolRef.current) return;

      const cur = sceneRef.current;

      // If we're ON the story scene and scrolling forward:
      // advance chapter first; only exit to next scene when on last chapter
      if (cur === STORY_SCENE && dir === 1) {
        const chIdx = storyIdxRef.current;
        if (chIdx < CHAPTERS.length - 1) {
          // still have chapters — step forward
          coolRef.current = true;
          setTimeout(() => {
            coolRef.current = false;
          }, 650);
          window.dispatchEvent(new CustomEvent("story:step", { detail: 1 }));
          return;
        }
        // on last chapter — fall through to next scene
      }

      // If we're ON the story scene and scrolling backward:
      // go back through chapters first; only exit to prev scene when on first chapter
      if (cur === STORY_SCENE && dir === -1) {
        const chIdx = storyIdxRef.current;
        if (chIdx > 0) {
          coolRef.current = true;
          setTimeout(() => {
            coolRef.current = false;
          }, 650);
          window.dispatchEvent(new CustomEvent("story:step", { detail: -1 }));
          return;
        }
        // on first chapter — fall through to prev scene
      }

      // Normal scene change
      coolRef.current = true;
      setTimeout(() => {
        coolRef.current = false;
      }, 750);
      goTo(cur + dir);
    },
    [goTo]
  );

  useEffect(() => {
    // wheel
    const onWheel = (e: WheelEvent) => {
      handleScroll(e.deltaY > 0 ? 1 : -1);
    };
    // touch swipe detection
    // Uses elementFromPoint at touchstart to know if user tapped an interactive element.
    // document.elementFromPoint respects pointer-events CSS — returns the actual
    // clickable element, not the transparent overlay on top.
    let ty0 = 0,
      tx0 = 0;
    let isSwipe = false;
    let startedOnInteractive = false;

    const INTERACTIVE = 'a, button, input, select, textarea, [role="button"]';

    const onTS = (e: TouchEvent) => {
      const t = e.touches[0];
      ty0 = t.clientY;
      tx0 = t.clientX;
      isSwipe = false;
      // elementFromPoint returns the topmost element that pointer-events can hit
      // This correctly finds the <a> or <button> even when parent has pointer-events:none
      const el = document.elementFromPoint(
        t.clientX,
        t.clientY
      ) as HTMLElement | null;
      startedOnInteractive = !!el?.closest(INTERACTIVE);
    };

    const onTM = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const dy = Math.abs(ty0 - e.touches[0].clientY);
      const dx = Math.abs(tx0 - e.touches[0].clientX);
      if (dy > 70 && dy > dx * 2) isSwipe = true;
    };

    const onTE = (e: TouchEvent) => {
      if (coolRef.current) return;
      if (!isSwipe) return;
      if (startedOnInteractive) return; // user tapped a link/button — never swipe
      const dy = ty0 - e.changedTouches[0].clientY;
      handleScroll(dy > 0 ? 1 : -1);
    };
    // keyboard
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") handleScroll(1);
      if (e.key === "ArrowUp" || e.key === "PageUp") handleScroll(-1);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: true });
    window.addEventListener("touchend", onTE, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchmove", onTM);
      window.removeEventListener("touchend", onTE);
      window.removeEventListener("keydown", onKey);
    };
  }, [handleScroll]);

  // hidden scroll container — just to allow programmatic scrollTop
  return (
    <div
      ref={scrollRef}
      className="hide-scroll"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflowY: "scroll",
        pointerEvents: "none",
        visibility: "hidden",
      }}
    >
      {Array.from({ length: TOTAL }, (_, i) => (
        <div key={i} style={{ height: "100dvh", flexShrink: 0 }} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   PROGRESS BAR
════════════════════════════════════════════ */
function ProgressBar({ scene }: { scene: number }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        height: 2,
        background: "rgba(201,169,110,.1)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${(scene / (TOTAL - 1)) * 100}%`,
          background:
            "linear-gradient(90deg,var(--gold-d),var(--gold),var(--gold-l))",
          boxShadow: "0 0 8px var(--gold)",
          transition: "width .5s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   LOADING
════════════════════════════════════════════ */
function Loading({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"count" | "reveal" | "out">("count");
  const doneRef = useRef(false);
  const idRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    idRef.current = setInterval(() => {
      setPct((p) => Math.min(94, p + Math.random() * 3.5));
    }, 55);
    return () => {
      if (idRef.current) clearInterval(idRef.current);
    };
  }, []);

  useEffect(() => {
    if (pct >= 94 && !doneRef.current) {
      doneRef.current = true;
      // Clear interval immediately before any state updates
      if (idRef.current) {
        clearInterval(idRef.current);
        idRef.current = null;
      }
      setPct(100);
      setTimeout(() => setPhase("reveal"), 300);
      setTimeout(() => setPhase("out"), 1400);
      setTimeout(onDone, 2200);
    }
  }, [pct, onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "var(--dark)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        overflow: "hidden",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity .7s ease" : "none",
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* ambient radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(201,169,110,.06) 0%, transparent 65%)",
          opacity: phase === "reveal" ? 1 : 0,
          transition: "opacity 1s ease",
          pointerEvents: "none",
        }}
      />

      {/* top shimmer line — slides in */}
      <div
        style={{
          width: phase === "reveal" ? "120px" : "0px",
          height: 1,
          background:
            "linear-gradient(90deg,transparent,var(--gold),transparent)",
          transition: "width .8s cubic-bezier(.4,0,.2,1)",
          marginBottom: 28,
        }}
      />

      {/* name — character reveal feel */}
      <h1
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: "clamp(2rem,9vw,3.8rem)",
          fontWeight: 300,
          letterSpacing: phase === "reveal" ? ".18em" : ".04em",
          color: phase === "reveal" ? GL : "rgba(240,217,154,.45)",
          textShadow: phase === "reveal" ? TG : "none",
          transition:
            "letter-spacing 1s cubic-bezier(.4,0,.2,1), color 1s ease, text-shadow 1s ease",
          marginBottom: 20,
          whiteSpace: "nowrap",
        }}
      >
        Ais &amp; Tangkas
      </h1>

      {/* progress track */}
      <div
        style={{
          width: 180,
          height: 1,
          background: "rgba(201,169,110,.12)",
          position: "relative",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background:
              "linear-gradient(90deg,var(--gold-d),var(--gold),var(--gold-l))",
            boxShadow: "0 0 8px var(--gold)",
            transition: "width .1s linear",
          }}
        />
        {/* sweep shimmer on top */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg,transparent 0%,rgba(255,255,255,.2) 50%,transparent 100%)",
            transform: `translateX(${pct * 2 - 100}%)`,
            transition: "transform .1s linear",
          }}
        />
      </div>

      {/* percentage */}
      <p
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: ".7rem",
          letterSpacing: ".28em",
          color: phase === "reveal" ? G : "rgba(201,169,110,.35)",
          transition: "color .6s ease",
        }}
      >
        {Math.round(pct)}%
      </p>

      {/* label */}
      <p
        style={{
          fontSize: ".5rem",
          letterSpacing: ".5em",
          textTransform: "uppercase",
          color: MUT,
          marginTop: 8,
          opacity: phase === "count" ? 0.6 : 0,
          transition: "opacity .5s ease",
        }}
      >
        Memuat undangan...
      </p>

      {/* bottom shimmer */}
      <div
        style={{
          width: phase === "reveal" ? "120px" : "0px",
          height: 1,
          background:
            "linear-gradient(90deg,transparent,var(--gold),transparent)",
          transition: "width .8s .1s cubic-bezier(.4,0,.2,1)",
          marginTop: 28,
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   OPENING
════════════════════════════════════════════ */
function Opening({ onOpen }: { onOpen: () => void }) {
  const [stage, setStage] = useState(0); // 0=hidden 1=bg 2=content 3=closing
  const [hov, setHov] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 80);
    const t2 = setTimeout(() => setStage(2), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleOpen = () => {
    setStage(3);
    // Trigger global music player
    window.dispatchEvent(new Event("wedding:play"));
    setTimeout(onOpen, 900);
  };

  const show = stage >= 2 && stage < 3;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        overflow: "hidden",
        opacity: stage === 3 ? 0 : stage >= 1 ? 1 : 0,
        transition:
          stage === 3
            ? "opacity .85s ease"
            : stage === 1
            ? "opacity .6s ease"
            : "none",
        pointerEvents: stage === 3 || stage === 0 ? "none" : "all",
      }}
    >
      {/* BG: blurred photo hint */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(22,15,7,.55) 0%, rgba(8,6,4,.98) 65%)",
        }}
      />

      {/* Decorative rings */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "min(500px,90vw)",
          height: "min(500px,90vw)",
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          border: "1px solid rgba(201,169,110,.06)",
          opacity: show ? 1 : 0,
          transition: "opacity 1.2s ease, transform 1.2s ease",
          transformOrigin: "center",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "min(340px,70vw)",
          height: "min(340px,70vw)",
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          border: "1px solid rgba(201,169,110,.1)",
          opacity: show ? 1 : 0,
          transition: "opacity 1s .15s ease",
          pointerEvents: "none",
        }}
      />

      {/* CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          padding: "0 6vw",
        }}
      >
        {/* top shimmer */}
        <div
          style={{
            width: show ? "90px" : "0px",
            height: 1,
            background:
              "linear-gradient(90deg,transparent,var(--gold),transparent)",
            transition: "width .7s cubic-bezier(.4,0,.2,1)",
            marginBottom: 20,
          }}
        />

        {/* eyebrow */}
        <p
          style={{
            fontSize: ".56rem",
            letterSpacing: ".55em",
            textTransform: "uppercase",
            color: MUT,
            marginBottom: 14,
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
            transition: "opacity .7s .1s ease, transform .7s .1s ease",
          }}
        >
          Undangan Pernikahan
        </p>

        {/* NAMES — staggered */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(.4rem,2vw,.8rem)",
            marginBottom: 16,
          }}
        >
          {["Ais", "&", "Tangkas"].map((word, i) => (
            <span
              key={i}
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize:
                  word === "&"
                    ? "clamp(2.5rem,10vw,5rem)"
                    : "clamp(3rem,12vw,6rem)",
                fontWeight: 300,
                fontStyle: word === "&" ? "italic" : "normal",
                letterSpacing: ".1em",
                color: word === "&" ? G : GL,
                textShadow: TG,
                opacity: show ? 1 : 0,
                transform: show ? "translateY(0)" : "translateY(20px)",
                transition: `opacity .8s ${
                  0.15 + i * 0.12
                }s ease, transform .8s ${
                  0.15 + i * 0.12
                }s cubic-bezier(.4,0,.2,1)`,
                display: "block",
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* date */}
        <p
          style={{
            fontSize: ".62rem",
            letterSpacing: ".38em",
            textTransform: "uppercase",
            color: MUT,
            marginBottom: 28,
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
            transition: "opacity .7s .45s ease, transform .7s .45s ease",
          }}
        >
          07 Juni 2026
        </p>

        {/* divider shimmer */}
        <div
          style={{
            width: show ? "90px" : "0px",
            height: 1,
            background:
              "linear-gradient(90deg,transparent,var(--gold),transparent)",
            transition: "width .7s .35s cubic-bezier(.4,0,.2,1)",
            marginBottom: 32,
          }}
        />

        {/* CTA button — elegant fade + scale */}
        <button
          onClick={handleOpen}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={
            {
              padding: ".95rem 3.2rem",
              border: "1px solid rgba(201,169,110,.6)",
              background: hov ? G : "rgba(201,169,110,.06)",
              color: hov ? "var(--dark)" : GL,
              fontFamily: "'Jost',sans-serif",
              fontSize: ".68rem",
              letterSpacing: ".38em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: 2,
              transition: "all .38s ease",
              boxShadow: hov ? "0 8px 32px rgba(201,169,110,.25)" : "none",
              opacity: show ? 1 : 0,
              transform: show
                ? "translateY(0) scale(1)"
                : "translateY(14px) scale(.97)",
            } as React.CSSProperties
          }
        >
          Buka Undangan
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ROOT
════════════════════════════════════════════ */
type Phase = "loading" | "opening" | "experience";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [scene, setScene] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const goScene = useCallback((i: number) => setScene(i), []);

  const dotClick = useCallback((i: number) => {
    setScene(i);
    if (scrollRef.current) scrollRef.current.scrollTop = i * innerHeight;
    // If jumping TO story scene, reset to chapter 0
    if (i === STORY_SCENE) {
      storyIdxRef.current = 0;
      window.dispatchEvent(new CustomEvent("story:reset"));
    }
  }, []);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "var(--dark)",
      }}
    >
      {phase === "loading" && <Loading onDone={() => setPhase("opening")} />}
      {phase === "opening" && <Opening onOpen={() => setPhase("experience")} />}

      {phase === "experience" && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 0,
              overflow: "hidden",
            }}
          >
            <PhotoWorld scene={scene} />
          </div>
          <Particles />
          <SnapScroller onScene={goScene} scrollRef={scrollRef} />
          <HeroOv show={scene === 0} />
          <GroomOv show={scene === 1} />
          <BrideOv show={scene === 2} />
          <QuoteOv show={scene === 3} />
          <StoryOv show={scene === 4} />
          <EventOv show={scene === 5} />
          <CountdownOv show={scene === 6} />
          <ClosingOv show={scene === 7} />
          <ProgressBar scene={scene} />
          <DotNav scene={scene} onDot={dotClick} />
          <p
            style={{
              position: "fixed",
              bottom: 18,
              left: 18,
              zIndex: 400,
              fontSize: ".5rem",
              letterSpacing: ".38em",
              textTransform: "uppercase",
              color: "rgba(201,169,110,.35)",
              pointerEvents: "none",
            }}
          >
            {SCENE_LABELS[scene]}
          </p>
        </>
      )}
    </main>
  );
}
