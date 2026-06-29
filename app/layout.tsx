import type { Metadata } from "next";
import { Geist, Anton, Oswald } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Athletic display type to match the icon's wordmark.
const anton = Anton({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const oswald = Oswald({
  weight: ["400", "500", "600", "700"],
  variable: "--font-condensed",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Trade Machine — Pro Basketball Trades",
  description:
    "A lifelike pro basketball trade machine with real 2025-26 salaries and full salary-matching, apron, and luxury-tax rules.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${anton.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
