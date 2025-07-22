"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/landing/section";
import { VKLogoXL } from "@/components/landing/vk-logo";
import { 
  Sparkles, 
  Zap, 
  Users, 
  Code2, 
  ArrowRight, 
  Play,
  ChevronDown,
  Globe,
  Shield,
  Rocket
} from "lucide-react";

// Floating animation component
function FloatingElement({ 
  children, 
  delay = 0, 
  duration = 3000,
  className 
}: { 
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <div 
      className={cn(
        "animate-bounce",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationIterationCount: 'infinite',
        animationDirection: 'alternate'
      }}
    >
      {children}
    </div>
  );
}

// Gradient text component
function GradientText({ 
  children, 
  className,
  gradient = "from-blue-600 via-purple-600 to-pink-600"
}: { 
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}) {
  return (
    <span className={cn(
      `bg-gradient-to-r ${gradient} bg-clip-text text-transparent`,
      className
    )}>
      {children}
    </span>
  );
}

// Feature badge component
function FeatureBadge({ 
  icon: Icon, 
  text, 
  variant = "default" 
}: { 
  icon: React.ElementType;
  text: string;
  variant?: "default" | "primary" | "secondary";
}) {
  const variants = {
    default: "bg-secondary/50 text-secondary-foreground border-border/50",
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-accent/50 text-accent-foreground border-accent/50"
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border backdrop-blur-sm transition-all duration-300 hover:scale-105",
      variants[variant]
    )}>
      <Icon className="h-4 w-4 mr-2" />
      {text}
    </span>
  );
}

// Stats component
function StatsSection() {
  const stats = [
    { value: "10K+", label: "Developers", icon: Users },
    { value: "99.9%", label: "Uptime", icon: Shield },
    { value: "< 2s", label: "Boot Time", icon: Zap },
    { value: "Global", label: "CDN", icon: Globe }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="text-center group"
        >
          <div className="flex items-center justify-center mb-2">
            <stat.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          </div>
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {stat.value}
          </div>
          <div className="text-sm text-muted-foreground">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EnhancedLandingHero() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: Rocket, text: "Powered by CheerpX WebVM", variant: "primary" as const },
    { icon: Zap, text: "Instant Setup", variant: "default" as const },
    { icon: Users, text: "Real-time Collaboration", variant: "secondary" as const }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    // Rotate features
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <Section className="relative overflow-hidden xl:py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />
        
        {/* Animated grid */}
        <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-800/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        {/* Floating elements */}
        <FloatingElement delay={0} className="absolute top-20 left-10 opacity-20">
          <Code2 className="h-8 w-8 text-blue-500" />
        </FloatingElement>
        <FloatingElement delay={1000} className="absolute top-40 right-20 opacity-20">
          <Sparkles className="h-6 w-6 text-purple-500" />
        </FloatingElement>
        <FloatingElement delay={2000} className="absolute bottom-40 left-20 opacity-20">
          <Zap className="h-7 w-7 text-pink-500" />
        </FloatingElement>
      </div>

      <div className="container relative">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Logo Animation */}
          <div className={cn(
            "transition-all duration-1000 transform",
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
          )}>
            <VKLogoXL className="mb-6" />
          </div>

          {/* Main Heading */}
          <div className={cn(
            "space-y-4 transition-all duration-1000 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl">
              Code Anywhere, Deploy Instantly with{" "}
              <GradientText className="block mt-2">
                Browser-Based Development
              </GradientText>
            </h1>
            
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground md:text-xl leading-relaxed">
              Experience the future of development with VibeKraft's WebVM-powered workspaces.
              Full Linux environments, VS Code-like interface, and collaborative coding - all running directly in your browser.
            </p>
          </div>

          {/* Feature Badges */}
          <div className={cn(
            "flex flex-wrap justify-center gap-3 transition-all duration-1000 delay-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            {features.map((feature, index) => (
              <div
                key={feature.text}
                className={cn(
                  "transition-all duration-500",
                  index === currentFeature ? "scale-110 z-10" : "scale-100"
                )}
              >
                <FeatureBadge {...feature} />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <Link href="/auth/register">
              <Button 
                size="lg" 
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg"
              >
                <Sparkles className="h-5 w-5 mr-2 group-hover:animate-spin" />
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            
            <Link href="#demo">
              <Button 
                variant="outline" 
                size="lg"
                className="group border-2 hover:bg-muted/50 px-8 py-6 text-lg backdrop-blur-sm"
              >
                <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Stats Section */}
          <div className={cn(
            "w-full max-w-4xl transition-all duration-1000 delay-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <StatsSection />
          </div>

          {/* Scroll Indicator */}
          <div className={cn(
            "absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="flex flex-col items-center space-y-2 text-muted-foreground">
              <span className="text-sm">Scroll to explore</span>
              <ChevronDown className="h-5 w-5 animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// Export both for backward compatibility
export { EnhancedLandingHero as LandingHero };