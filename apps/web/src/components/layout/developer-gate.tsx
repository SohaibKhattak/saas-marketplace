"use client";
import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, XCircle } from "lucide-react";
import { Loader } from '@/components/ui/loader';

interface DeveloperProfile {
  applicationStatus: "PENDING" | "APPROVED" | "REJECTED";
  businessName: string;
  rejectionReason: string | null;
  createdAt: string;
}

export function DeveloperGate({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "approved" | "pending" | "rejected">(
    user?.role === "DEVELOPER" ? "approved" : "loading"
  );
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);

  useEffect(() => {
    if (user?.role !== "DEVELOPER" || !accessToken) {
      setStatus((prev) => prev !== "approved" ? "approved" : prev); // Non-developers skip this gate
      return;
    }

    // Always fetch profile to know the actual status, but we don't block if already developer
    api.get<{ data: DeveloperProfile }>("/developers/me", { token: accessToken })
      .then((res) => {
        setProfile(res.data);
        setStatus(res.data.applicationStatus === "APPROVED" ? "approved" : res.data.applicationStatus === "PENDING" ? "pending" : "rejected");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "PROFILE_NOT_FOUND") {
          setStatus("pending"); // No profile found
        } else {
          setStatus("approved"); // On error, let through to avoid blocking
        }
      });
  }, [user, accessToken]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader />
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-amber-500/10">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Application Under Review</CardTitle>
            <CardDescription>
              Your developer application is being reviewed by our team. You&apos;ll be notified once a decision is made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile && (
              <>
                <div className="flex items-center justify-between rounded-sm border p-3">
                  <span className="text-sm font-semibold tracking-tight">Status</span>
                  <Badge variant="outline" className="text-amber-600">Pending Review</Badge>
                </div>
                <div className="flex items-center justify-between rounded-sm border p-3">
                  <span className="text-sm font-semibold tracking-tight">Business</span>
                  <span className="text-sm text-gray-500">{profile.businessName}</span>
                </div>
                <div className="flex items-center justify-between rounded-sm border p-3">
                  <span className="text-sm font-semibold tracking-tight">Submitted</span>
                  <span className="text-sm text-gray-500">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Application Rejected</CardTitle>
            <CardDescription>
              Unfortunately, your developer application was not approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.rejectionReason && (
              <div className="rounded-sm border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm font-semibold tracking-tight text-destructive">Reason</p>
                <p className="mt-1 text-sm text-destructive/80">{profile.rejectionReason}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 text-center">
              Please contact support if you believe this was a mistake.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
