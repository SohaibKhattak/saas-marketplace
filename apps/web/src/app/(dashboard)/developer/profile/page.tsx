"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ImagePlus,
  X,
  Building2,
  Globe,
  FileText,
  Package,
  DollarSign,
  Users,
} from "lucide-react";

interface DeveloperProfile {
  id: string;
  businessName: string;
  businessEmail: string;
  // taxId: string | null;
  bio: string | null;
  status: string;
}

export default function DeveloperProfilePage() {
  const { user, accessToken, fetchUser, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [firstName, setFirstName] = useState(() => {
    const parts = (user?.fullName ?? "").split(" ");
    return parts[0] ?? "";
  });
  const [lastName, setLastName] = useState(() => {
    const parts = (user?.fullName ?? "").split(" ");
    return parts.slice(1).join(" ") ?? "";
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Developer business info
  const [devProfile, setDevProfile] = useState<DeveloperProfile | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  // const [taxId, setTaxId] = useState("");
  const [bio, setBio] = useState("");
  // const [website, setWebsite] = useState("");
  const [devLoading, setDevLoading] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stripe Connect state
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeSetupError, setStripeSetupError] = useState<string | null>(null);
  const [stripeDashboardLoading, setStripeDashboardLoading] = useState(false);
  const [stripeSuccess, setStripeSuccess] = useState(false);
  const [stripeRefresh, setStripeRefresh] = useState(false);

  // Stats
  const [stats, setStats] = useState({ products: 0, subscribers: 0, revenue: 0 });

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  const currentFullName = `${firstName} ${lastName}`.trim();
  const isProfileDirty =
    currentFullName !== (user?.fullName ?? "") ||
    avatarFile !== null ||
    avatarPreview !== (user?.avatarUrl ?? null);

  const fetchDevProfile = useCallback(async () => {
    try {
      const res = await api.get<{ data: DeveloperProfile & { stripeAccountId: string | null } }>("/developers/me", { token: accessToken! });
      setDevProfile(res.data);
      setBusinessName(res.data.businessName ?? "");
      setBusinessEmail(res.data.businessEmail ?? "");
      // setTaxId(res.data.taxId ?? "");
      setBio(res.data.bio ?? "");
      setStripeAccountId(res.data.stripeAccountId ?? null);
    } catch {
      setProfileMessage({ type: "error", text: "Failed to load developer profile" });
    } finally {
      setDevLoading(false);
    }
  }, [accessToken]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<{ data: { totalProducts: number; totalSubscribers: number; totalRevenue: number } }>(
        "/developers/analytics",
        { token: accessToken! }
      );
      setStats({
        products: res.data.totalProducts ?? 0,
        subscribers: res.data.totalSubscribers ?? 0,
        revenue: res.data.totalRevenue ?? 0,
      });
    } catch {
      setProfileMessage({ type: "error", text: "Failed to load stats" });
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDevProfile();
    fetchStats();
  }, [fetchDevProfile, fetchStats]);

  // Stripe URL param detection (success/refresh redirect)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("stripe") === "success") setStripeSuccess(true);
      if (params.get("stripe") === "refresh") setStripeRefresh(true);

      // Clean up URL
      if (params.has("stripe")) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  async function handleConnectStripe() {
    setStripeLoading(true);
    setStripeSetupError(null);
    try {
      const res = await api.post<{ url: string }>("/developers/stripe/connect", {}, { token: accessToken! });
      window.location.href = res.url;
    } catch (err: any) {
      console.error("Failed to connect stripe", err);
      setStripeSetupError(err.message || "Failed to start Stripe Connect setup.");
    } finally {
      setStripeLoading(false);
    }
  }

  async function handleViewStripeDashboard() {
    setStripeDashboardLoading(true);
    setStripeSetupError(null);
    try {
      const res = await api.get<{ url: string }>("/developers/stripe/login-link", { token: accessToken! });
      window.open(res.url, "_blank");
    } catch (err: any) {
      console.error("Failed to generate stripe login link", err);
      setStripeSetupError(err.message || "Failed to open Stripe Dashboard.");
    } finally {
      setStripeDashboardLoading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMessage({ type: "error", text: "Please select an image file (PNG, JPG, etc.)" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: "Image must be less than 5MB" });
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleProfileSave() {
    setProfileMessage(null);
    setSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const formData = new FormData();
      formData.append("fullName", fullName);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await api.patch<{ data: { avatarUrl?: string, fullName?: string } }>("/users/me", formData, {
        token: accessToken!
      });

      updateUser(res.data);
      if (res?.data?.avatarUrl) {
        setAvatarPreview(res.data.avatarUrl);
      }
      setAvatarFile(null);
      setProfileMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err: any) {
      setProfileMessage({
        type: "error",
        text: err.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setPwMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }
    setPwSaving(true);
    try {
      await api.post("/users/me/change-password", { currentPassword, newPassword }, { token: accessToken! });
      setPwMessage({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwMessage({ type: "error", text: err instanceof ApiError ? err.message : "Failed to change password" });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/developer/products" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-semibold tracking-tight">Profile</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developer Profile</h1>
        <p className="text-gray-500 mt-1">
          Manage your personal and business details visible to customers.
        </p>
      </div>

      {/* Status Messages */}
      {profileMessage && (
        <div
          className={`flex items-center gap-2 rounded-sm p-3 text-sm animate-fade-in ${profileMessage.type === "success"
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-red-50 text-red-700 border border-red-200 shadow-sm rounded-sm"
            }`}
        >
          {profileMessage.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {profileMessage.text}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm rounded-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-white0/10">
              <Package className="h-6 w-6 text-neutral-900" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.products}</p>
              <p className="text-sm text-gray-500">Products</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-green-500/10">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.subscribers}</p>
              <p className="text-sm text-gray-500">Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-white0/10">
              <DollarSign className="h-6 w-6 text-neutral-900" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.revenue.toFixed(0)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Info */}
      <Card className="border border-gray-200 shadow-sm rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-black" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your personal details visible on your developer profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-muted">
                  {saving && avatarFile ? (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                      <Loader2 className="h-8 w-8 text-black animate-spin" />
                    </div>
                  ) : avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Profile photo" className="object-cover" />
                  ) : (
                    <AvatarFallback className="text-3xl font-semibold bg-gray-100 text-black">{initials}</AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-sm bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <ImagePlus className="h-6 w-6 text-white" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm text-black font-semibold tracking-tight hover:underline">
                  <ImagePlus className="h-3.5 w-3.5" />
                  {avatarPreview ? "Change Photo" : "Upload Photo"}
                </button>
                {avatarPreview && (
                  <button type="button" onClick={removePhoto} className="flex items-center gap-1 text-sm text-gray-500 hover:text-destructive transition-colors">
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">JPG, PNG or GIF. Max 5MB.</p>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="h-11 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="h-11 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="devEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input id="devEmail" value={user?.email ?? ""} disabled className="h-11 pl-10 pr-20 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
                    <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                      Verified
                    </Badge>
                  </div>
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" className="h-11 pl-10 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="space-y-1 mb-6">
            <h3 className="text-lg font-semibold tracking-tight text-neutral-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-black" />
              Business Details
            </h3>
            <p className="text-sm text-gray-500">
              Your business information displayed to potential customers.
            </p>
          </div>
          {devLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Corp" className="h-11 pl-10 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input id="businessEmail" type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="contact@company.com" className="h-11 pl-10 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
                  </div>
                </div>
              </div>

              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="XX-XXXXXXX" className="h-11 pl-10 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className="h-11 pl-10 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
                  </div>
                </div> 
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Description</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about yourself and your products..." rows={4} className="resize-none border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200" />
              </div>

              {devProfile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Developer Status:</span>
                  <Badge variant={devProfile.status === "APPROVED" ? "default" : "secondary"} className={devProfile.status === "APPROVED" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" : ""}>
                    {devProfile.status === "APPROVED" ? "Verified Developer" : devProfile.status}
                  </Badge>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Manage Security Section */}
      <Card className="border border-gray-200 shadow-sm rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-black" />
            Manage Security
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-tight text-neutral-900">Password</p>
              <p className="text-sm text-gray-500">Change your password to keep your account secure.</p>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div>
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button
                              variant="outline"
                              disabled={user?.authProvider === 'GOOGLE'}
                              className="border-gray-300 hover:bg-gray-50 text-neutral-900 font-semibold tracking-tight transition-all duration-200"
                            >
                              <Lock className="mr-2 h-4 w-4" /> Change Password
                            </Button>
                          }
                        />
                        {user?.authProvider !== 'GOOGLE' && (
                          <DialogContent className="sm:max-w-106.25 rounded-sm">
                            <DialogHeader>
                              <DialogTitle>Change Password</DialogTitle>
                              <DialogDescription>
                                Enter your current password and a new one to update your security credentials.
                              </DialogDescription>
                            </DialogHeader>

                            {pwMessage && (
                              <div className={`flex items-center gap-2 rounded-sm p-3 text-sm animate-fade-in ${pwMessage.type === 'success'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {pwMessage.type === 'success' ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 shrink-0" />
                                )}
                                {pwMessage.text}
                              </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                              <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                  <Input
                                    id="currentPassword"
                                    type={showCurrentPw ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    placeholder="Enter current password"
                                    className="h-11 pl-10 pr-10 border-gray-300 rounded-sm focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neutral-900 transition-colors"
                                  >
                                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                  <Input
                                    id="newPassword"
                                    type={showNewPw ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="Min 8 characters"
                                    className="h-11 pl-10 pr-10 border-gray-300 rounded-sm focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowNewPw(!showNewPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neutral-900 transition-colors"
                                  >
                                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                  <Input
                                    id="confirmNewPassword"
                                    type={showConfirmPw ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="Confirm new password"
                                    className="h-11 pl-10 pr-10 border-gray-300 rounded-sm focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neutral-900 transition-colors"
                                  >
                                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-end pt-4">
                                <Button type="submit" className="bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 transition-all duration-200" disabled={pwSaving}>
                                  {pwSaving ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                                  ) : (
                                    <><Lock className="mr-2 h-4 w-4" /> Save Password</>
                                  )}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        )}
                      </Dialog>
                    </div>
                  }
                />
                {user?.authProvider === 'GOOGLE' && (
                  <TooltipContent>
                    <p>Google accounts cannot change password via this method. Please manage it via Google.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Payouts / Stripe Connect */}
      <Card className="border border-gray-200 shadow-sm rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-black" />
            Payouts & Revenue Share
          </CardTitle>
          <CardDescription>
            Link your Stripe account to receive your 85% revenue share automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stripeSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-sm bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold tracking-tight">Stripe Connected Successfully!</p>
                <p className="text-green-700/80">You will now receive automatic payout transfers.</p>
              </div>
            </div>
          )}

          {stripeRefresh && (
            <div className="mb-4 flex items-center gap-2 rounded-sm bg-orange-500/10 p-4 text-sm text-orange-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold tracking-tight">Stripe Connection Incomplete</p>
                <p className="text-orange-700/80">Please click the setup button below again to complete your onboarding.</p>
              </div>
            </div>
          )}

          {stripeSetupError && (
            <div className="mb-4 rounded-sm bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold tracking-tight">Setup Failed</p>
                <p className="text-destructive/80 mt-0.5">{stripeSetupError}</p>
              </div>
            </div>
          )}

          {devLoading ? (
            <Loader2 className="animate-spin" />
          ) : !stripeAccountId ? (
            <div className="rounded-sm border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold tracking-tight text-primary-900">Setup Stripe Connect</p>
                <p className="text-sm text-gray-600 mt-1">To get paid instantly for your subscriptions, you need to connect your Stripe account.</p>
              </div>
              <Button onClick={handleConnectStripe} disabled={stripeLoading}>
                {stripeLoading ? "Connecting..." : "Set up Stripe Payouts"}
              </Button>
            </div>
          ) : (
            <div className="rounded-sm border border-green-500/20 bg-green-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold tracking-tight text-green-900 dark:text-green-400">Stripe Account Connected</p>
                <p className="text-sm text-green-700/80 dark:text-green-500 mt-1">Your payouts are configured. You will automatically receive 85% of your sales revenue.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30">Active</Badge>
                <Button variant="outline" size="sm" onClick={handleViewStripeDashboard} disabled={stripeDashboardLoading}>
                  {stripeDashboardLoading ? "Opening..." : "Go to Stripe Dashboard"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex items-center justify-end gap-3 px-6 py-3 max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => { const parts = (user?.fullName ?? "").split(" "); setFirstName(parts[0] ?? ""); setLastName(parts.slice(1).join(" ") ?? ""); setProfileMessage(null); }}>
            Cancel
          </Button>
          <Button onClick={handleProfileSave} disabled={saving || !isProfileDirty}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
