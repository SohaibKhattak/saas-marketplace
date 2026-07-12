"use client";
import { Loader } from '@/components/ui/loader';

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
import { Building, Mail, FileText, Briefcase, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

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
        <Loader />
      </div>
    );
  }

  // Already approved — redirect to developer dashboard
  if (profile?.applicationStatus === "APPROVED" || user?.role === "DEVELOPER") {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Card className="mx-auto w-full max-w-md border-0 shadow-xl ring-1 ring-gray-200/50">
          <CardHeader className="text-center space-y-4 pt-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">You're a developer!</CardTitle>
            <CardDescription className="text-base">
              Your application has been approved. You can now create products and manage your WordPress sites.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-10">
            <Button size="lg" onClick={() => router.push("/developer/products")} className="gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Pending application
  if (profile?.applicationStatus === "PENDING") {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Card className="mx-auto w-full max-w-md border-0 shadow-xl ring-1 ring-gray-200/50">
          <CardHeader className="text-center space-y-4 pt-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Application Pending</CardTitle>
            <CardDescription className="text-base">
              Your developer application is currently being reviewed. We'll notify you once a decision has been made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-10 px-8">
            <div className="rounded-xl border bg-gray-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pending Review</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Business Name</span>
                <span className="text-sm font-semibold">{profile.businessName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Submitted</span>
                <span className="text-sm font-semibold">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected — show reason and allow reapplication
  const isRejected = profile?.applicationStatus === "REJECTED";

  return (
    <div className="mx-auto max-w-2xl py-12 animate-fade-in">
      <div className="mb-10 text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Become a <span className="bg-linear-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">Developer</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Apply for developer status to publish and manage your SaaS products on our marketplace.
        </p>
      </div>

      {isRejected && (
        <div className="mb-8 rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex gap-3 animate-slide-up">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Application Rejected</p>
            {profile?.rejectionReason && (
              <p className="mt-1 text-sm text-destructive/90">
                Reason: {profile.rejectionReason}
              </p>
            )}
            <p className="mt-2 text-sm text-destructive/80">
              Please review the feedback, update your information, and reapply below.
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-8 rounded-xl border border-green-500/20 bg-green-50 p-4 flex gap-3 animate-slide-up">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Application Submitted!</p>
            <p className="text-sm text-green-700 mt-1">
              We have received your application and will review it shortly. You will be notified of our decision via email.
            </p>
          </div>
        </div>
      )}

      <Card className="border-0 shadow-xl ring-1 ring-gray-200/50 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b bg-gray-50/50 px-8 py-6">
            <CardTitle className="text-xl">{isRejected ? "Reapply for Developer Status" : "Developer Application"}</CardTitle>
            <CardDescription>
              Provide your business details to help us understand your offerings
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 py-8">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-sm font-semibold text-gray-700">Business Name <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="businessName"
                  placeholder="e.g. Acme Corp"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                  className="pl-10 h-11 transition-all focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessEmail" className="text-sm font-semibold text-gray-700">Business Email <span className="text-gray-400 font-normal">(optional)</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessEmail"
                    type="email"
                    placeholder="contact@example.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="pl-10 h-11 transition-all focus-visible:ring-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId" className="text-sm font-semibold text-gray-700">Tax ID <span className="text-gray-400 font-normal">(optional)</span></Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="taxId"
                    placeholder="SSN, EIN, etc."
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="pl-10 h-11 transition-all focus-visible:ring-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Company Bio <span className="text-gray-400 font-normal">(optional)</span></Label>
                <span className="text-xs text-gray-400">{bio.length}/1000</span>
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <Textarea
                  id="bio"
                  placeholder="Tell us about your company, your products, and what you plan to build..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  className="pl-10 py-3 resize-none transition-all focus-visible:ring-1"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50/50 px-8 py-6 border-t flex justify-end">
            <Button type="submit" size="lg" className="w-full sm:w-auto px-8" disabled={submitting || success}>
              {submitting ? "Submitting..." : isRejected ? "Submit Application" : "Submit Application"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
