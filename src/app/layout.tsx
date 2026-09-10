import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aici",
  description: "See it. Report it. Fix it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
