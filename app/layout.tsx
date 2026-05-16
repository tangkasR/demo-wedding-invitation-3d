import type { Metadata, Viewport } from "next";
import "./globals.css";
import MusicPlayer from "./components/MusicPlayer";

export const metadata: Metadata = {
  title: "Ais & Tangkas – Wedding Invitation",
  description:
    "Undangan Pernikahan Puspitalia Dwi Aisah & Tangkas Risdianto · 7 Juni 2026",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#080604",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <MusicPlayer />
      </body>
    </html>
  );
}
