"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  CreditCard,
  Package,
  Megaphone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";


interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-sm transition-colors ${enabled ? "bg-black" : "bg-muted-foreground/30"
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-sm bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();


  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [subscriptionAlerts, setSubscriptionAlerts] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
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
        <Link href="/customer/subscriptions" className="hover:text-foreground transition-colors">
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
                <Package className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Subscription Alerts</p>
                <p className="text-xs text-gray-500">Get notified about subscription renewals and expirations</p>
              </div>
            </div>
            <Toggle enabled={subscriptionAlerts} onChange={setSubscriptionAlerts} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-orange-500/10">
                <CreditCard className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Billing Alerts</p>
                <p className="text-xs text-gray-500">Payment confirmations, failed charges, and invoices</p>
              </div>
            </div>
            <Toggle enabled={billingAlerts} onChange={setBillingAlerts} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white0/10">
                <Package className="h-4 w-4 text-neutral-900" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Product Updates</p>
                <p className="text-xs text-gray-500">Updates from products you are subscribed to</p>
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

      {/* Appearance section removed: theme selection is no longer supported */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-neutral-900" />
            Language
          </CardTitle>
          <CardDescription>
            Choose your preferred language.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-neutral-100">
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
              <p className="text-xs text-gray-500">Download a copy of all your data (subscriptions, billing, profile)</p>
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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex items-center justify-end gap-3 px-6 py-3 max-w-7xl mx-auto">
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
              This action is permanent and cannot be undone. All your data, subscriptions,
              and billing history will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-sm bg-destructive/10 p-4 text-sm">
            <p className="font-semibold tracking-tight text-destructive mb-1">This will permanently delete:</p>
            <ul className="list-disc list-inside text-gray-500 space-y-1">
              <li>Your profile and personal information</li>
              <li>All active subscriptions</li>
              <li>Complete billing and payment history</li>
              <li>All associated data and preferences</li>
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
