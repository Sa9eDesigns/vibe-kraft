"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github, Mail, Loader2 } from "lucide-react";

export function OAuthButtons() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setIsLoading(provider);
    try {
      await signIn(provider, {
        redirectTo: "/dashboard",
      });
    } catch (error) {
      console.error("OAuth sign-in error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        onClick={() => handleOAuthSignIn("google")}
        disabled={isLoading !== null}
        type="button"
      >
        {isLoading === "google" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
      <Button
        variant="outline"
        onClick={() => handleOAuthSignIn("github")}
        disabled={isLoading !== null}
        type="button"
      >
        {isLoading === "github" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Github className="mr-2 h-4 w-4" />
        )}
        GitHub
      </Button>
    </div>
  );
}
