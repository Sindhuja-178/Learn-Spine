import type { Metadata } from "next";
import "./globals.css";
import { ConsentBanner } from "@/components/consent-banner";

export const metadata: Metadata = {
  title: {
    default: "LearnSpine — AI Study Flowcharts, Flashcards & Quizzes",
    template: "%s | LearnSpine",
  },
  description: "Convert text and YouTube links into simple flowcharts, interactive flashcards, and quizzes using AI.",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const maxDuration = 60;


export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body className="antialiased">
          {children}
          <ConsentBanner />
        </body>
      </html>
    );
  }
