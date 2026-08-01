import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LearnSpine — AI Study Flowcharts, Flashcards & Quizzes",
    template: "%s | LearnSpine",
  },
  description: "Convert text and YouTube links into simple flowcharts, interactive flashcards, and quizzes using AI.",
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
        </body>
      </html>
    );
  }
