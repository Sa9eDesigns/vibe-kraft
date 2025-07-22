"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/landing/section";
import { VKLogoLarge } from "@/components/landing/vk-logo";
import { AnimatedBackground, GradientOrbs } from "@/components/ui/animated-background";
import { 
  Sparkles, 
  ArrowRight, 
  Rocket,
  Users,
  Zap,
  Shield,
  Star
} from "lucide-react";

// Floating testimonial component
function FloatingTestimonial({ 
  quote, 
  author, 
  role, 
  delay = 0,
  className 
}: {
  quote: string;
  author: string;
  role: string;
  delay?: number;
  className?: string;
}) {
  return (
    <div 
      className={cn(
        "absolute p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg max-w-xs",
        "animate-float opacity-80 hover:opacity-100 transition-opacity duration-300",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-sm text-foreground/90 mb-2">"{quote}"</p>
      <div className="text-xs">
        <div className="font-medium text-foreground">{author}</div>
        <div className="text-muted-foreground">{role}</div>
      </div>
    </div>
  );
}

// Stats counter component
function StatsCounter({ 
  value, 
  label, 
  icon: Icon,
  delay = 0 
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={cn(
      "text-center transition-all duration-700 transform",
      isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
    )}>
      <div className="flex items-center justify-center mb-2">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function EnhancedLandingCTA() {
  const [isHovered, setIsHovered] = useState(false);

  const testimonials = [
    {
      quote: "VibeKraft changed how we develop. No more environment setup!",
      author: "Sarah Chen",
      role: "Lead Developer"
    },
    {
      quote: "The collaboration features are incredible. Our team loves it!",
      author: "Mike Rodriguez",
      role: "Engineering Manager"
    },
    {
      quote: "Finally, a development environment that just works everywhere.",
      author: "Alex Kim",
      role: "Full Stack Developer"
    }
  ];

  const stats = [
    { value: "50K+", label: "Developers", icon: Users },
    { value: "99.9%", label: "Uptime", icon: Shield },
    { value: "< 2s", label: "Boot Time", icon: Zap },
    { value: "24/7", label: "Support", icon: Rocket }
  ];

  return (
    <Section className="relative overflow-hidden py-24 md:py-32">
      <AnimatedBackground variant="mesh" />
      <GradientOrbs />
      
      {/* Floating testimonials */}
      <FloatingTestimonial
        {...testimonials[0]}
        delay={0}
        className="top-20 left-10 hidden lg:block"
      />
      <FloatingTestimonial
        {...testimonials[1]}
        delay={1000}
        className="top-32 right-16 hidden lg:block"
      />
      <FloatingTestimonial
        {...testimonials[2]}
        delay={2000}
        className="bottom-32 left-20 hidden lg:block"
      />

      <div className="container relative">
        <div className="flex flex-col items-center text-center space-y-12">
          {/* Logo with enhanced animation */}
          <div className="relative">
            <VKLogoLarge className="mb-6" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse" />
          </div>

          {/* Main CTA Content */}
          <div className="max-w-4xl space-y-6">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Ready to{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Transform
              </span>{" "}
              Your Development?
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join thousands of developers who've already made the switch to browser-based development. 
              Start coding in seconds, not minutes.
            </p>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link href="/auth/register">
              <Button 
                size="lg"
                className={cn(
                  "group relative overflow-hidden px-8 py-6 text-lg font-semibold",
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                  "text-white shadow-2xl hover:shadow-3xl transition-all duration-300",
                  "border-0 hover:scale-105"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Animated background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 transition-opacity duration-300",
                  isHovered ? "opacity-100" : "opacity-0"
                )} />
                
                {/* Button content */}
                <div className="relative flex items-center gap-2">
                  <Sparkles className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isHovered ? "animate-spin" : ""
                  )} />
                  Start Building for Free
                  <ArrowRight className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isHovered ? "translate-x-1" : ""
                  )} />
                </div>

                {/* Shimmer effect */}
                {isHovered && (
                  <div className="absolute inset-0 animate-shimmer" />
                )}
              </Button>
            </Link>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Setup in 30 seconds</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="w-full max-w-4xl pt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <StatsCounter
                  key={stat.label}
                  {...stat}
                  delay={index * 200}
                />
              ))}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="pt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Trusted by developers at
            </p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              {/* Placeholder for company logos */}
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">
                Company A
              </div>
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">
                Company B
              </div>
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">
                Company C
              </div>
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">
                Company D
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// Export both for backward compatibility
export { EnhancedLandingCTA as LandingCTA };