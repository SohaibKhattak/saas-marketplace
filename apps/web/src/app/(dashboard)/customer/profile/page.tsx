"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Camera,
  Loader2,
  ChevronRight,
  ImagePlus,
  X,
} from "lucide-react";

export default function ProfilePage() {
  const { user, accessToken, fetchUser } = useAuthStore();
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
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

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

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
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
      await api.patch("/users/me", { fullName }, { token: accessToken! });
      await fetchUser();
      setProfileMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err instanceof ApiError ? err.message : "Failed to update profile",
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
      await api.post(
        "/users/me/change-password",
        { currentPassword, newPassword },
        { token: accessToken! }
      );
      setPwMessage({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwMessage({
        type: "error",
        text: err instanceof ApiError ? err.message : "Failed to change password",
      });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/customer/subscriptions" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Profile</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal details, contact information, and security preferences.
        </p>
      </div>

      {/* Status Messages */}
      {profileMessage && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm animate-fade-in ${
            profileMessage.type === "success"
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {profileMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {profileMessage.text}
        </div>
      )}

      {/* Public Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Public Profile
          </CardTitle>
          <CardDescription>
            This information will be displayed on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Avatar with upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-muted">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Profile photo" />
                  ) : null}
                  <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Hover overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {avatarPreview ? "Change Photo" : "Upload Photo"}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>

            {/* Profile Fields */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Product Manager, Developer, Designer"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short bio..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact Details
          </CardTitle>
          <CardDescription>
            Your contact information is kept private and secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user?.email ?? ""}
                  disabled
                  className="h-11 pl-10 pr-20"
                />
                <Badge
                  variant="secondary"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                >
                  Verified
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="h-11 pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Login Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security & Login
          </CardTitle>
          <CardDescription>
            Keep your account secure by updating your password regularly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pwMessage && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm mb-5 animate-fade-in ${
                pwMessage.type === "success"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {pwMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {pwMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="h-11 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Confirm new password"
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="outline" disabled={pwSaving}>
                {pwSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                ) : (
                  <><Lock className="mr-2 h-4 w-4" /> Update Password</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Account Information
          </CardTitle>
          <CardDescription>
            Details about your account status and membership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Account Type</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-medium">
                  {user?.role === "DEVELOPER" ? "Developer" : user?.role === "ADMIN" ? "Admin" : "Customer"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-end gap-3 px-6 py-3 max-w-screen-xl mx-auto">
          <Button
            variant="outline"
            onClick={() => {
              const parts = (user?.fullName ?? "").split(" ");
              setFirstName(parts[0] ?? "");
              setLastName(parts.slice(1).join(" ") ?? "");
              setJobTitle("");
              setBio("");
              setPhoneNumber("");
              setAvatarPreview(null);
              setProfileMessage(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleProfileSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
