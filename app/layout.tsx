import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  fallback: ["system-ui", "Arial", "sans-serif"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  fallback: ["ui-monospace", "SFMono-Regular", "Monaco", "Consolas", "monospace"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VibeKraft - The Ultimate SAAS Platform",
  description: "A modern SAAS platform for teams and organizations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CheerpX WebVM Script - Loaded dynamically by components when needed */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader 
          color="hsl(var(--primary))"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
          shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <Toaster position="top-center" />
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
