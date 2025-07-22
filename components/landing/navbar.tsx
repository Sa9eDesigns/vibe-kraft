"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, Sparkles, Zap, Users, Code2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { VKLogo, VKLogoSmall } from "@/components/landing/vk-logo";

// Navigation items with icons
const navigationItems = [
  {
    label: "Demo",
    href: "#demo",
    icon: Zap,
    description: "See VibeKraft in action"
  },
  {
    label: "Workspace",
    href: "/dashboard/webvm",
    icon: Code2,
    description: "Browser-based development"
  },
  {
    label: "Pricing",
    href: "/pricing",
    icon: Users,
    description: "Plans for every team"
  },
];

// Mobile Navigation Component
function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <VKLogoSmall />
              <span className="font-bold text-lg">VibeKraft</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 p-6">
            <nav className="space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Actions */}
          <div className="p-6 border-t space-y-3">
            <Link href="/auth/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full">
                Log in
              </Button>
            </Link>
            <Link href="/auth/register" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      isScrolled 
        ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm" 
        : "bg-background/60 backdrop-blur-sm border-b border-transparent"
    )}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-3 group">
            <VKLogo />
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                VibeKraft
              </span>
              <span className="text-xs text-muted-foreground -mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Code Anywhere
              </span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-muted/50 hover:text-primary group"
              >
                <item.icon className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                {item.label}
              </Link>
            ))}
            
            {/* Docs with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Docs
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/docs" className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Documentation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/docs/api" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    API Reference
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/docs/examples" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Examples
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="hover:bg-muted/50">
                Log in
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Get Started
              </Button>
            </Link>
          </div>
          
          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}