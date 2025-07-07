"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Section, SectionHeader, SectionContent } from "@/components/landing/section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StarIcon } from "lucide-react";

interface Testimonial {
  name: string;
  title?: string;
  content: string;
  avatar?: string;
  rating?: number;
  company?: {
    name: string;
    logo?: string;
  };
}

interface TestimonialsProps {
  title?: string;
  description?: string;
  badge?: string;
  testimonials: Testimonial[];
  columns?: 1 | 2 | 3;
  className?: string;
  background?: "default" | "muted" | "primary" | "secondary";
  align?: "left" | "center" | "right";
  variant?: "default" | "simple" | "quote";
  showRating?: boolean;
  children?: React.ReactNode;
}

export function Testimonials({
  title = "Testimonials",
  description,
  badge,
  testimonials,
  columns = 2,
  className,
  background = "default",
  align = "center",
  variant = "default",
  showRating = false,
  children,
}: TestimonialsProps) {
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
          )}
        >
          {testimonials.map((testimonial, index) => {
            if (variant === "simple") {
              return (
                <div key={index} className="flex flex-col space-y-4 p-6 border rounded-lg bg-background">
                  {showRating && testimonial.rating && (
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={cn(
                            "h-4 w-4", 
                            i < testimonial.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          )} 
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-muted-foreground">{testimonial.content}</p>
                  <div className="flex items-center gap-2 mt-auto pt-4">
                    {testimonial.avatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="text-sm font-medium">{testimonial.name}</p>
                      {testimonial.title && (
                        <p className="text-xs text-muted-foreground">{testimonial.title}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            
            if (variant === "quote") {
              return (
                <div key={index} className="flex flex-col space-y-4 p-6 border rounded-lg bg-background">
                  <div className="text-4xl text-primary">"</div>
                  <p className="text-muted-foreground italic">{testimonial.content}</p>
                  <div className="flex items-center gap-4 mt-auto pt-4">
                    {testimonial.avatar && (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      {testimonial.title && (
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            
            // Default variant
            return (
              <Card key={index} className="border bg-background">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar>
                    {testimonial.avatar ? (
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    ) : null}
                    <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                    <CardDescription>{testimonial.title}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {showRating && testimonial.rating && (
                    <div className="flex mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={cn(
                            "h-4 w-4", 
                            i < testimonial.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          )} 
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-muted-foreground">{testimonial.content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {children}
      </SectionContent>
    </Section>
  );
}

// Default implementation for backward compatibility
export function LandingTestimonials() {
  const defaultTestimonials = [
    {
      name: "Sarah Johnson",
      title: "CEO, TechStart",
      content:
        "VibeKraft has transformed how we manage our projects. The intuitive interface and powerful features have boosted our productivity by 30%.",
      avatar: "/avatars/avatar-1.png",
    },
    {
      name: "Michael Chen",
      title: "CTO, InnovateCorp",
      content:
        "The analytics tools provided by VibeKraft have given us insights we never had before. It's been a game-changer for our decision-making process.",
      avatar: "/avatars/avatar-2.png",
    },
    {
      name: "Emily Rodriguez",
      title: "Product Manager, GrowthLabs",
      content:
        "I've used many project management tools, but VibeKraft stands out with its seamless team collaboration features and excellent customer support.",
      avatar: "/avatars/avatar-3.png",
    },
    {
      name: "David Kim",
      title: "Founder, NextLevel",
      content:
        "Since implementing VibeKraft, we've reduced our operational costs by 25% and improved team communication significantly.",
      avatar: "/avatars/avatar-4.png",
    },
  ];

  return (
    <Testimonials
      title="Trusted by businesses worldwide"
      description="See what our customers have to say about their experience with our platform."
      badge="Testimonials"
      testimonials={defaultTestimonials}
      columns={2}
    />
  );
}