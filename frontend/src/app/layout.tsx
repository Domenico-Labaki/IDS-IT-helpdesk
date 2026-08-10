import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/lib/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "IDS IT Helpdesk",
  description: "Internal helpdesk and ticketing portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", inter.variable, "font-sans")}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <ThemeProvider><Providers>{children}</Providers></ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
