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
import { Clock, XCircle, Loader2 } from "lucide-react";

interface DeveloperProfile {
  applicationStatus: "PENDING" | "APPROVED" | "REJECTED";
  businessName: string;
  rejectionReason: string | null;
  createdAt: string;
}

export function DeveloperGate({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "approved" | "pending" | "rejected">("loading");
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);

  useEffect(() => {
    if (user?.role !== "DEVELOPER" || !accessToken) {
      setStatus("approved"); // Non-developers skip this gate
      return;
    }

    api.get<{ data: DeveloperProfile }>("/developers/me", { token: accessToken })
      .then((res) => {
        setProfile(res.data);
        setStatus(res.data.applicationStatus === "APPROVED" ? "approved" : res.data.applicationStatus === "PENDING" ? "pending" : "rejected");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "PROFILE_NOT_FOUND") {
          setStatus("pending"); // No profile found — shouldn't happen with new flow but handle gracefully
        } else {
          setStatus("approved"); // On error, let through to avoid blocking
        }
      });
  }, [user, accessToken]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
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
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="outline" className="text-amber-600">Pending Review</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Business</span>
                  <span className="text-sm text-muted-foreground">{profile.businessName}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Submitted</span>
                  <span className="text-sm text-muted-foreground">
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Application Rejected</CardTitle>
            <CardDescription>
              Unfortunately, your developer application was not approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.rejectionReason && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">Reason</p>
                <p className="mt-1 text-sm text-destructive/80">{profile.rejectionReason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Please contact support if you believe this was a mistake.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
