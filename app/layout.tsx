import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
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
        {/* CheerpX WebVM Script */}
        <script 
          src="https://cxrtnc.leaningtech.com/2.0/cx.js"
          async
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
