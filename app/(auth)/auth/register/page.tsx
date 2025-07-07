import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">VK</span>
          </div>
          <span className="font-bold text-xl">VibeKraft</span>
        </div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground">
          Join VibeKraft and start coding in the browser
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Choose your preferred sign up method
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <OAuthButtons />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <RegisterForm />
        </CardContent>
        </Card>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
);
}