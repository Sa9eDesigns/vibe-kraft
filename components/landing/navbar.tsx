"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export function LandingNavbar() {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VK</span>
              </div>
              <span className="font-bold text-xl">VibeKraft</span>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="#demo"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Demo
            </Link>
            <Link
              href="/dashboard/webvm"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Workspace
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Docs
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}