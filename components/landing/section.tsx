"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
  fullWidth?: boolean;
  as?: React.ElementType;
}

export function Section({
  children,
  className,
  id,
  fullWidth = false,
  as: Component = "section",
  ...props
}: SectionProps) {
  return (
    <Component
      id={id}
      className={cn(
        "w-full py-12 md:py-24 lg:py-32",
        className
      )}
      {...props}
    >
      <div className={cn(
        fullWidth ? "w-full" : "container mx-auto px-4 md:px-6",
        "flex flex-col items-center justify-center"
      )}>
        {children}
      </div>
    </Component>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  className?: string;
  align?: "left" | "center" | "right";
}

export function SectionHeader({
  title,
  description,
  badge,
  className,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col space-y-4 mb-8",
        align === "center" && "items-center text-center",
        align === "right" && "items-end text-right",
        className
      )}
    >
      <div className="space-y-2">
        {badge && (
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
            {badge}
          </div>
        )}
        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
          {title}
        </h2>
        {description && (
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface SectionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionContent({ children, className }: SectionContentProps) {
  return (
    <div className={cn("w-full max-w-7xl mx-auto", className)}>
      {children}
    </div>
  );
}