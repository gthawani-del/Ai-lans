import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeAreAiLabs LMS",
  description: "Explore. Learn. Create. Together.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
