"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Section } from "@/components/landing/section";
import { Button } from "@/components/ui/button";

interface CTAProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  primaryAction?: {
    text: string;
    href: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
  };
  secondaryAction?: {
    text: string;
    href: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
  };
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  background?: "default" | "muted" | "primary" | "secondary";
  align?: "left" | "center" | "right";
  className?: string;
  children?: React.ReactNode;
}

export function CTA({
  title,
  description,
  primaryAction,
  secondaryAction,
  image,
  background = "primary",
  align = "center",
  className,
  children,
}: CTAProps) {
  const backgroundClasses = {
    default: "",
    muted: "bg-muted/50",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary",
  };

  return (
    <Section className={cn(backgroundClasses[background], className)}>
      <div 
        className={cn(
          "flex flex-col space-y-6 max-w-4xl mx-auto",
          align === "center" && "items-center text-center",
          align === "right" && "items-end text-right",
          image && "md:flex-row md:space-y-0 md:space-x-8 md:items-center"
        )}
      >
        <div className={cn(
          "space-y-4",
          image && "md:w-1/2"
        )}>
          {typeof title === "string" ? (
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              {title}
            </h2>
          ) : (
            title
          )}
          
          {description && typeof description === "string" ? (
            <p className={cn(
              "max-w-[600px]",
              background === "primary" ? "text-primary-foreground/80" : "text-muted-foreground",
              "md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
            )}>
              {description}
            </p>
          ) : (
            description
          )}
          
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {primaryAction && (
                <Link href={primaryAction.href}>
                  <Button 
                    size="lg" 
                    variant={background === "primary" ? "secondary" : "default"}
                    {...primaryAction}
                  >
                    {primaryAction.text}
                  </Button>
                </Link>
              )}
              
              {secondaryAction && (
                <Link href={secondaryAction.href}>
                  <Button 
                    size="lg" 
                    variant={background === "primary" ? "outline" : "outline"}
                    className={background === "primary" ? "bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10" : ""}
                    {...secondaryAction}
                  >
                    {secondaryAction.text}
                  </Button>
                </Link>
              )}
            </div>
          )}
          
          {children}
        </div>
        
        {image && (
          <div className={cn(
            "md:w-1/2",
            align === "center" && "mx-auto"
          )}>
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
export function LandingCTA() {
  return (
    <CTA
      title={
        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
          Ready to revolutionize your development workflow?
        </h2>
      }
      description={
        <div className="space-y-4">
          <p className="text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[600px]">
            Join developers worldwide who are already experiencing the future of coding with VibeKraft's browser-based development environment.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-white">
              ✨ No setup required
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-white">
              🚀 Instant deployment
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-white">
              🤝 Team collaboration
            </span>
          </div>
        </div>
      }
      primaryAction={{
        text: "Start Building Today",
        href: "/auth/register",
        className: "bg-white text-primary hover:bg-white/90",
      }}
      secondaryAction={{
        text: "Sign In",
        href: "/auth/login",
        className: "bg-transparent border-white/20 hover:bg-white/10 text-white",
      }}
      background="primary"
    />
  );
}