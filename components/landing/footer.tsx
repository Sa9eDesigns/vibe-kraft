"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Section } from "@/components/landing/section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  LinkedinIcon, 
  GithubIcon,
  YoutubeIcon,
} from "lucide-react";

interface FooterColumn {
  title: string;
  links: {
    text: string;
    href: string;
    external?: boolean;
  }[];
}

interface SocialLink {
  platform: "facebook" | "twitter" | "instagram" | "linkedin" | "github" | "youtube";
  href: string;
}

interface FooterProps {
  logo?: React.ReactNode;
  description?: string;
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
  newsletter?: {
    title: string;
    description?: string;
    buttonText?: string;
    placeholderText?: string;
  };
  copyright?: string;
  className?: string;
  background?: "default" | "muted" | "primary" | "secondary";
  bordered?: boolean;
  children?: React.ReactNode;
}

export function Footer({
  logo,
  description,
  columns = [],
  socialLinks = [],
  newsletter,
  copyright,
  className,
  background = "default",
  bordered = true,
  children,
}: FooterProps) {
  const backgroundClasses = {
    default: "",
    muted: "bg-muted/50",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary",
  };

  const socialIcons = {
    facebook: <FacebookIcon className="h-5 w-5" />,
    twitter: <TwitterIcon className="h-5 w-5" />,
    instagram: <InstagramIcon className="h-5 w-5" />,
    linkedin: <LinkedinIcon className="h-5 w-5" />,
    github: <GithubIcon className="h-5 w-5" />,
    youtube: <YoutubeIcon className="h-5 w-5" />,
  };

  return (
    <footer className={cn(backgroundClasses[background], className)}>
      {bordered && <Separator />}
      <Section className="py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            {logo}
            {description && (
              <p className={cn(
                "text-sm",
                background === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {description}
              </p>
            )}
            
            {socialLinks.length > 0 && (
              <div className="flex space-x-4">
                {socialLinks.map((link, index) => (
                  <Link 
                    key={index} 
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "hover:opacity-80 transition-opacity",
                      background === "primary" ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {socialIcons[link.platform]}
                    <span className="sr-only">{link.platform}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {columns.map((column, index) => (
            <div key={index} className="space-y-4">
              <h3 className={cn(
                "text-sm font-medium",
                background === "primary" ? "text-primary-foreground" : ""
              )}>
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "text-sm hover:underline",
                        background === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {newsletter && (
            <div className="space-y-4">
              <h3 className={cn(
                "text-sm font-medium",
                background === "primary" ? "text-primary-foreground" : ""
              )}>
                {newsletter.title}
              </h3>
              {newsletter.description && (
                <p className={cn(
                  "text-sm",
                  background === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {newsletter.description}
                </p>
              )}
              <form className="flex space-x-2">
                <Input 
                  type="email" 
                  placeholder={newsletter.placeholderText || "Enter your email"} 
                  className={cn(
                    "h-9",
                    background === "primary" && "bg-primary-foreground/10 border-primary-foreground/20"
                  )}
                  required
                />
                <Button 
                  type="submit" 
                  size="sm"
                  variant={background === "primary" ? "secondary" : "default"}
                >
                  {newsletter.buttonText || "Subscribe"}
                </Button>
              </form>
            </div>
          )}
        </div>
        
        {children}
        
        {copyright && (
          <div className="mt-12 pt-6 border-t border-border">
            <p className={cn(
              "text-sm text-center",
              background === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {copyright}
            </p>
          </div>
        )}
      </Section>
    </footer>
  );
}

// Default implementation for backward compatibility
export function LandingFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <Footer
      logo={
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">VibeKraft</span>
        </Link>
      }
      description="Streamline your workflow, collaborate with your team, and grow your business with our all-in-one solution."
      columns={[
        {
          title: "Product",
          links: [
            { text: "Features", href: "/features" },
            { text: "Pricing", href: "/pricing" },
            { text: "Roadmap", href: "/roadmap" },
            { text: "Changelog", href: "/changelog" },
          ],
        },
        {
          title: "Company",
          links: [
            { text: "About", href: "/about" },
            { text: "Blog", href: "/blog" },
            { text: "Careers", href: "/careers" },
            { text: "Contact", href: "/contact" },
          ],
        },
        {
          title: "Resources",
          links: [
            { text: "Documentation", href: "/docs" },
            { text: "Tutorials", href: "/tutorials" },
            { text: "Support", href: "/support" },
            { text: "API", href: "/api" },
          ],
        },
      ]}
      socialLinks={[
        { platform: "twitter", href: "https://twitter.com" },
        { platform: "github", href: "https://github.com" },
        { platform: "linkedin", href: "https://linkedin.com" },
      ]}
      newsletter={{
        title: "Subscribe to our newsletter",
        description: "Get the latest updates and news directly to your inbox.",
        buttonText: "Subscribe",
      }}
      copyright={`© ${currentYear} VibeKraft. All rights reserved.`}
      background="muted"
    />
  );
}