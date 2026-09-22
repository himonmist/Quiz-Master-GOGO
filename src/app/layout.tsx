import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiz Master GOGO",
  description: "Think Fast. Answer Right. Rise to the Top. Real-time competitive quizzes powered by accuracy, speed, and intelligent scoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
