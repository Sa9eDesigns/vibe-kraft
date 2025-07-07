"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/landing/section";

interface HeroAction {
  href: string;
  label: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

interface HeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  align?: "left" | "center" | "right";
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  className?: string;
  children?: React.ReactNode;
}

export function Hero({
  title,
  subtitle,
  image,
  align = "center",
  primaryAction,
  secondaryAction,
  className,
  children,
}: HeroProps) {
  return (
    <Section 
      className={cn("xl:py-48", className)}
    >
      <div 
        className={cn(
          "flex flex-col space-y-8",
          align === "center" && "items-center text-center",
          align === "right" && "items-end text-right",
          image && "lg:flex-row lg:space-y-0 lg:space-x-8"
        )}
      >
        <div className={cn(
          "flex flex-col space-y-4",
          image && "lg:w-1/2"
        )}>
          <div className="space-y-2">
            {typeof title === "string" ? (
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                {title}
              </h1>
            ) : (
              title
            )}
            
            {subtitle && typeof subtitle === "string" ? (
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                {subtitle}
              </p>
            ) : (
              subtitle
            )}
          </div>
          
          {(primaryAction || secondaryAction) && (
            <div className={cn(
              "flex flex-wrap gap-4",
              align === "center" && "justify-center",
              align === "right" && "justify-end"
            )}>
              {primaryAction && (
                <Link href={primaryAction.href}>
                  <Button size="lg" {...primaryAction}>
                    {primaryAction.label}
                  </Button>
                </Link>
              )}
              
              {secondaryAction && (
                <Link href={secondaryAction.href}>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    {...secondaryAction}
                  >
                    {secondaryAction.label}
                  </Button>
                </Link>
              )}
            </div>
          )}
          
          {children}
        </div>
        
        {image && (
          <div className="lg:w-1/2">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    </Section>
  );
}

// Default implementation for backward compatibility
export function LandingHero() {
  return (
    <Hero
      title={
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
          Code Anywhere, Deploy Instantly with{" "}
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Browser-Based Development
          </span>
        </h1>
      }
      subtitle={
        <div className="space-y-4">
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Experience the future of development with VibeKraft's WebVM-powered workspaces.
            Full Linux environments, VS Code-like interface, and collaborative coding - all running directly in your browser.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-primary border border-primary/20">
              🚀 Powered by CheerpX WebVM
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-secondary-foreground border border-border">
              ⚡ Instant Setup
            </span>
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-accent-foreground border border-border">
              🤝 Real-time Collaboration
            </span>
          </div>
        </div>
      }
      primaryAction={{
        href: "/auth/register",
        label: "Get Started Free",
        className: "bg-primary hover:bg-primary/90 text-primary-foreground",
      }}
      secondaryAction={{
        href: "#demo",
        label: "See Demo",
      }}
    />
  );
}