"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, SectionContent } from "@/components/landing/section";
import { Check, X } from "lucide-react";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: PricingFeature[];
  cta: {
    text: string;
    href: string;
  };
  popular?: boolean;
  variant?: "default" | "outline" | "secondary";
}

interface PricingProps {
  title?: string;
  description?: string;
  badge?: string;
  plans: PricingPlan[];
  className?: string;
  background?: "default" | "muted" | "primary" | "secondary";
  align?: "left" | "center" | "right";
  children?: React.ReactNode;
}

export function Pricing({
  title = "Pricing",
  description,
  badge,
  plans,
  className,
  background = "default",
  align = "center",
  children,
}: PricingProps) {
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
        <div className="mx-auto grid max-w-6xl gap-6 pt-8 md:pt-12 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                "relative rounded-lg border p-6 shadow-sm",
                plan.popular && "border-primary shadow-md",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Popular
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">/{plan.period}</span>
                  )}
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                    <span className={cn(
                      "text-sm",
                      !feature.included && "text-muted-foreground line-through"
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button
                  asChild
                  className="w-full"
                  variant={plan.variant || (plan.popular ? "default" : "outline")}
                >
                  <a href={plan.cta.href}>{plan.cta.text}</a>
                </Button>
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
export function LandingPricing() {
  const defaultPlans = [
    {
      name: "Starter",
      price: "$9",
      period: "month",
      description: "Perfect for individuals and small teams",
      features: [
        { text: "Up to 5 team members", included: true },
        { text: "10GB storage", included: true },
        { text: "Basic analytics", included: true },
        { text: "Email support", included: true },
        { text: "Advanced integrations", included: false },
        { text: "Priority support", included: false },
        { text: "Custom branding", included: false },
      ],
      cta: {
        text: "Get Started",
        href: "/auth/register?plan=starter",
      },
      variant: "outline" as const,
    },
    {
      name: "Professional",
      price: "$29",
      period: "month",
      description: "Best for growing businesses",
      features: [
        { text: "Up to 25 team members", included: true },
        { text: "100GB storage", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Priority email support", included: true },
        { text: "Advanced integrations", included: true },
        { text: "Phone support", included: true },
        { text: "Custom branding", included: false },
      ],
      cta: {
        text: "Start Free Trial",
        href: "/auth/register?plan=professional",
      },
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "month",
      description: "For large organizations",
      features: [
        { text: "Unlimited team members", included: true },
        { text: "Unlimited storage", included: true },
        { text: "Advanced analytics", included: true },
        { text: "24/7 dedicated support", included: true },
        { text: "Advanced integrations", included: true },
        { text: "Phone & chat support", included: true },
        { text: "Custom branding", included: true },
      ],
      cta: {
        text: "Contact Sales",
        href: "/contact",
      },
      variant: "outline" as const,
    },
  ];

  return (
    <Pricing
      title="Choose the perfect plan for your needs"
      description="Start with our free plan and upgrade as your business grows."
      badge="Pricing"
      plans={defaultPlans}
      background="muted"
    />
  );
}
