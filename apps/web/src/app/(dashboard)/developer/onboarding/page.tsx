"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DeveloperProfile {
  id: string;
  applicationStatus: "PENDING" | "APPROVED" | "REJECTED";
  businessName: string;
  businessEmail: string;
  taxId: string | null;
  bio: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, accessToken, fetchUser } = useAuthStore();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get<{ data: DeveloperProfile }>("/developers/me", {
          token: accessToken!,
        });
        setProfile(res.data);
        // Pre-fill form for reapplication
        setBusinessName(res.data.businessName);
        setBusinessEmail(res.data.businessEmail);
        setTaxId(res.data.taxId ?? "");
        setBio(res.data.bio ?? "");
      } catch (err) {
        if (err instanceof ApiError && err.code === "PROFILE_NOT_FOUND") {
          // No profile yet — show the form
          if (user) {
            setBusinessEmail(user.email);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [accessToken, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post(
        "/developers/apply",
        {
          businessName,
          businessEmail,
          taxId: taxId || undefined,
          bio: bio || undefined,
        },
        { token: accessToken! }
      );
      setSuccess(true);
      // Refresh profile state
      const res = await api.get<{ data: DeveloperProfile }>("/developers/me", {
        token: accessToken!,
      });
      setProfile(res.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Already approved — redirect to developer dashboard
  if (profile?.applicationStatus === "APPROVED" || user?.role === "DEVELOPER") {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">You're a developer!</CardTitle>
          <CardDescription>
            Your application has been approved. You can now create products and manage your WordPress sites.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => router.push("/developer/products")}>
            Go to Products
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Pending application
  if (profile?.applicationStatus === "PENDING") {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Application Pending</CardTitle>
          <CardDescription>
            Your developer application is currently being reviewed. We'll notify you once a decision has been made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-sm border p-3">
            <span className="text-sm font-semibold tracking-tight">Status</span>
            <Badge variant="outline">Pending Review</Badge>
          </div>
          <div className="flex items-center justify-between rounded-sm border p-3">
            <span className="text-sm font-semibold tracking-tight">Business Name</span>
            <span className="text-sm text-gray-500">{profile.businessName}</span>
          </div>
          <div className="flex items-center justify-between rounded-sm border p-3">
            <span className="text-sm font-semibold tracking-tight">Submitted</span>
            <span className="text-sm text-gray-500">
              {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rejected — show reason and allow reapplication
  const isRejected = profile?.applicationStatus === "REJECTED";

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight">Become a Developer</h1>
      <p className="text-gray-500 mt-1">
        Apply for developer status to publish SaaS products on our marketplace
      </p>

      {isRejected && (
        <div className="mt-4 rounded-sm border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-semibold tracking-tight text-destructive">Your previous application was rejected</p>
          {profile?.rejectionReason && (
            <p className="mt-1 text-sm text-destructive/80">
              Reason: {profile.rejectionReason}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            You may update your information and reapply below.
          </p>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-sm border border-green-500/50 bg-green-500/10 p-4">
          <p className="text-sm font-semibold tracking-tight text-green-700 dark:text-green-400">
            Application submitted successfully! We'll review it shortly.
          </p>
        </div>
      )}

      <Card className="mt-6">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{isRejected ? "Reapply" : "Developer Application"}</CardTitle>
            <CardDescription>
              Fill in your business details to apply as a developer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Your company or brand name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                minLength={2}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email (optional)</Label>
              <Input
                id="businessEmail"
                type="email"
                placeholder="contact@yourbusiness.com"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID (optional)</Label>
              <Input
                id="taxId"
                placeholder="Your tax identification number"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and the products you plan to build..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500">{bio.length}/1000 characters</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting || success}>
              {submitting ? "Submitting..." : isRejected ? "Reapply" : "Submit Application"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
