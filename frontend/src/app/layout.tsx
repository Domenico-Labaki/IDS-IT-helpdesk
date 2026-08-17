import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/lib/theme-provider";

export const metadata: Metadata = {
  title: "HELIX AI Helpdesk",
  description: "Intelligent IT operations, ticketing, and support workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full font-sans">
      <body className="min-h-full bg-background text-foreground antialiased">
        <ThemeProvider><Providers>{children}</Providers></ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
