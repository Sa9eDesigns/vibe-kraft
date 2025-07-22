"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  variant?: "grid" | "dots" | "gradient" | "mesh";
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedBackground({ 
  variant = "grid", 
  className,
  children 
}: AnimatedBackgroundProps) {
  const variants = {
    grid: (
      <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-800/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
    ),
    dots: (
      <div className="absolute inset-0 bg-dot-slate-100/50 dark:bg-dot-slate-800/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
    ),
    gradient: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />
    ),
    mesh: (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />
        <div className="absolute inset-0 bg-grid-slate-100/30 dark:bg-grid-slate-800/30 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </>
    )
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 -z-10">
        {variants[variant]}
      </div>
      {children}
    </div>
  );
}

// Floating particles component
export function FloatingParticles({ 
  count = 20,
  className 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 20}s`
          }}
        />
      ))}
    </div>
  );
}

// Gradient orbs component
export function GradientOrbs({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000" />
    </div>
  );
}