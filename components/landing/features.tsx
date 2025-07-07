"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Section, SectionHeader, SectionContent } from "@/components/landing/section";
import {
  Users,
  Code,
  Terminal,
  Zap,
  Monitor,
  GitBranch,
  Cpu,
  Cloud,
} from "lucide-react";

interface Feature {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

interface FeaturesProps {
  title?: string;
  description?: string;
  badge?: string;
  features: Feature[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  background?: "default" | "muted" | "primary" | "secondary";
  align?: "left" | "center" | "right";
  iconPosition?: "top" | "left";
  bordered?: boolean;
  children?: React.ReactNode;
}

export function Features({
  title = "Features",
  description,
  badge,
  features,
  columns = 3,
  className,
  background = "default",
  align = "center",
  iconPosition = "top",
  bordered = true,
  children,
}: FeaturesProps) {
  const backgroundClasses = {
    default: "",
    muted: "bg-muted/50",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary",
  };

  return (
    <Section className={cn(backgroundClasses[background], className)}>
      {(title || description || badge) && (
        <SectionHeader
          title={title}
          description={description}
          badge={badge}
          align={align}
        />
      )}
      
      <SectionContent>
        <div 
          className={cn(
            "mx-auto grid max-w-6xl gap-6 pt-8 md:pt-12",
            columns === 1 && "grid-cols-1",
            columns === 2 && "grid-cols-1 md:grid-cols-2",
            columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col space-y-2 p-4",
                bordered && "rounded-lg border",
                iconPosition === "left" && "flex-row items-start space-x-4 space-y-0",
                align === "center" && iconPosition === "top" && "items-center text-center",
              )}
            >
              {feature.icon && (
                <div className={cn(
                  "rounded-full border p-2",
                  iconPosition === "left" && "mt-1",
                )}>
                  {feature.icon}
                </div>
              )}
              <div className={cn(
                "space-y-2",
                iconPosition === "left" && "flex-1",
              )}>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                {feature.description && (
                  <p className={cn(
                    "text-sm text-muted-foreground",
                    align === "center" && iconPosition === "top" && "text-center",
                  )}>
                    {feature.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {children}
      </SectionContent>
    </Section>
  );
}

// Default implementation for backward compatibility
export function LandingFeatures() {
  const defaultFeatures = [
    {
      icon: <Monitor className="h-6 w-6" />,
      title: "Browser-Based Development",
      description:
        "Full Linux development environment running directly in your browser. No downloads, no setup, just code.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Workspace Setup",
      description:
        "Launch a complete development environment in seconds. Pre-configured with popular tools and languages.",
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "VS Code-Like Interface",
      description:
        "Familiar editor experience with syntax highlighting, IntelliSense, and extensions support.",
    },
    {
      icon: <Terminal className="h-6 w-6" />,
      title: "Full Terminal Access",
      description:
        "Complete Linux terminal with package managers, compilers, and development tools at your fingertips.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Real-Time Collaboration",
      description:
        "Code together with your team in real-time. Share workspaces and collaborate seamlessly.",
    },
    {
      icon: <GitBranch className="h-6 w-6" />,
      title: "Git Integration",
      description:
        "Built-in Git support with visual diff, branch management, and seamless GitHub integration.",
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      title: "Powered by CheerpX",
      description:
        "Advanced WebAssembly technology providing native-like performance in the browser.",
    },
    {
      icon: <Cloud className="h-6 w-6" />,
      title: "Cloud-Native Architecture",
      description:
        "Scalable, secure, and accessible from anywhere. Your development environment follows you.",
    },
  ];

  return (
    <Features
      title="Revolutionary Development Experience"
      description="Experience the future of coding with our browser-based development environment powered by cutting-edge WebVM technology."
      badge="WebVM Features"
      features={defaultFeatures}
      columns={4}
      background="muted"
    />
  );
}