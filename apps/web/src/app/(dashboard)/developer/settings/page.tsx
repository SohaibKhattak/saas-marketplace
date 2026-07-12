"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Globe,
  Palette,
  Shield,
  Monitor,
  Moon,
  Sun,
  ChevronRight,
  Save,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Mail,
  DollarSign,
  Package,
  Megaphone} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-sm transition-colors ${
        enabled ? "bg-black" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-sm bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function DeveloperSettingsPage() {
  const { logout } = useAuthStore();
  const theme = "system" as string;
  const setTheme = (x: string) => {};

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [revenueAlerts, setRevenueAlerts] = useState(true);
  const [subscriberAlerts, setSubscriberAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);

  // Language
  const [language] = useState("English");

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/developer/products" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-semibold tracking-tight">Settings</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your notification preferences, appearance, and account settings.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-sm bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Settings saved successfully
        </div>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-neutral-900" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white0/10">
                <Mail className="h-4 w-4 text-neutral-900" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive important updates via email</p>
              </div>
            </div>
            <Toggle enabled={emailNotifs} onChange={setEmailNotifs} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-green-500/10">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Revenue Alerts</p>
                <p className="text-xs text-gray-500">Get notified about new sales and payouts</p>
              </div>
            </div>
            <Toggle enabled={revenueAlerts} onChange={setRevenueAlerts} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-orange-500/10">
                <Package className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">New Subscriber Alerts</p>
                <p className="text-xs text-gray-500">Get notified when someone subscribes to your products</p>
              </div>
            </div>
            <Toggle enabled={subscriberAlerts} onChange={setSubscriberAlerts} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white0/10">
                <Package className="h-4 w-4 text-neutral-900" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Product Review Updates</p>
                <p className="text-xs text-gray-500">Get notified when your products are approved or need changes</p>
              </div>
            </div>
            <Toggle enabled={productUpdates} onChange={setProductUpdates} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-pink-500/10">
                <Megaphone className="h-4 w-4 text-pink-500" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Marketing Emails</p>
                <p className="text-xs text-gray-500">Tips, new features, and promotional offers</p>
              </div>
            </div>
            <Toggle enabled={marketingEmails} onChange={setMarketingEmails} />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-neutral-900" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the platform looks for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 rounded-sm border-2 p-4 transition-all ${
                  theme === "light"
                    ? "border-primary bg-gray-100 shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Sun className={`h-6 w-6 ${theme === "light" ? "text-neutral-900" : "text-gray-500"}`} />
                <span className="text-sm font-semibold tracking-tight">Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 rounded-sm border-2 p-4 transition-all ${
                  theme === "dark"
                    ? "border-primary bg-gray-100 shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Moon className={`h-6 w-6 ${theme === "dark" ? "text-neutral-900" : "text-gray-500"}`} />
                <span className="text-sm font-semibold tracking-tight">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 rounded-sm border-2 p-4 transition-all ${
                  theme === "system"
                    ? "border-primary bg-gray-100 shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Monitor className={`h-6 w-6 ${theme === "system" ? "text-neutral-900" : "text-gray-500"}`} />
                <span className="text-sm font-semibold tracking-tight">System</span>
              </button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white0/10">
                <Globe className="h-4 w-4 text-neutral-900" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Language</p>
                <p className="text-xs text-gray-500">Choose your preferred language</p>
              </div>
            </div>
            <Badge variant="secondary">{language}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-neutral-900" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Manage your data and privacy preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-tight">Export Your Data</p>
              <p className="text-xs text-gray-500">Download a copy of all your data (products, revenue, profile)</p>
            </div>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-tight text-destructive">Delete Account</p>
              <p className="text-xs text-gray-500">Permanently delete your account and all associated data</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-end gap-3 px-6 py-3 max-w-screen-xl mx-auto">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader className="w-5 mr-2" /></>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data, products,
              WordPress sites, and revenue history will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-sm bg-destructive/10 p-4 text-sm">
            <p className="font-semibold tracking-tight text-destructive mb-1">This will permanently delete:</p>
            <ul className="list-disc list-inside text-gray-500 space-y-1">
              <li>Your profile and personal information</li>
              <li>All your products and pricing plans</li>
              <li>WordPress sites and their content</li>
              <li>Complete revenue and payout history</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Keep Account
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(false);
                logout();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Yes, Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
