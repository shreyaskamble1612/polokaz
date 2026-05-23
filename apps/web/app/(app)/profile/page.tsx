"use client";

import { authClient } from "@polokaz/auth/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Bell, CreditCard, LockKeyhole, Save, ShieldAlert, User2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  birthdate: z.string().min(1, "Birthdate is required"),
  countryName: z.string().min(2, "Country is required"),
});

const securitySchema = z
  .object({
    currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function formatDateInput(value?: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getTierLabel(tier?: string | null) {
  if (!tier) return "Free";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function ProfilePage() {
  const session = authClient.useSession();
  const user = session.data?.user;
  const [toast, setToast] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dealAlerts, setDealAlerts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      birthdate: "",
      countryName: "",
    },
  });

  const securityForm = useForm<z.infer<typeof securitySchema>>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user) return;

    profileForm.reset({
      name: user.name ?? "",
      email: user.email ?? "",
      birthdate: formatDateInput((user as { birthdate?: Date | string | null }).birthdate),
      countryName: (user as { countryName?: string | null }).countryName ?? "",
    });
  }, [profileForm, user]);

  const membershipDetails = useMemo(
    () => ({
      tier: getTierLabel((user as { tier?: string | null } | undefined)?.tier),
      renewsOn: "Jun 12, 2026",
      status: "Active",
    }),
    [user]
  );

  const saveProfile = profileForm.handleSubmit(async () => {
    setToast("Profile information saved.");
  });

  const saveSecurity = securityForm.handleSubmit(async () => {
    setToast("Password change saved.");
    securityForm.reset();
  });

  const saveNotifications = async () => {
    setToast("Notification preferences updated.");
  };

  const confirmDelete = async () => {
    setDeleteDialogOpen(false);
    setToast("Delete request submitted.");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white">
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 bottom-4 z-50 rounded-2xl border border-cyan-300/18 bg-zinc-950/92 px-4 py-3 text-sm text-zinc-200 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
            Profile & Settings
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Manage your profile, membership, and account preferences.
          </h1>
        </section>

        <div className="mt-8 grid gap-6">
          <Card className="border-white/10 bg-white/[0.04] py-0 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <CardContent className="px-6 py-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <User2 className="size-5 text-cyan-300" />
                    <h2 className="text-2xl font-semibold text-white">Profile Info</h2>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Update your member identity and contact details.
                  </p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="space-y-5">
                <FieldGroup className="grid gap-5 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input id="name" {...profileForm.register("name")} />
                    <FieldError errors={[profileForm.formState.errors.name]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" {...profileForm.register("email")} />
                    <FieldError errors={[profileForm.formState.errors.email]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="birthdate">Birthdate</FieldLabel>
                    <Input id="birthdate" type="date" {...profileForm.register("birthdate")} />
                    <FieldError errors={[profileForm.formState.errors.birthdate]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="countryName">Country</FieldLabel>
                    <Input id="countryName" {...profileForm.register("countryName")} />
                    <FieldError errors={[profileForm.formState.errors.countryName]} />
                  </Field>
                </FieldGroup>

                <Button type="submit" className="rounded-full bg-white text-zinc-950 hover:bg-cyan-100">
                  <Save className="size-4" />
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] py-0 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <CardContent className="px-6 py-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="size-5 text-amber-200" />
                    <h2 className="text-2xl font-semibold text-white">Membership</h2>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    See your current tier and billing status.
                  </p>
                </div>

                <Badge className="border-emerald-300/20 bg-emerald-500/14 text-emerald-100">
                  {membershipDetails.tier}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Tier</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{membershipDetails.tier}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Subscription</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{membershipDetails.status}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Renews On</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{membershipDetails.renewsOn}</p>
                </div>
              </div>

              <Button asChild className="mt-6 rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105">
                <a href="/plans">Upgrade Membership</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] py-0 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <CardContent className="px-6 py-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="size-5 text-cyan-300" />
                    <h2 className="text-2xl font-semibold text-white">Security</h2>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Change your password and keep your account protected.
                  </p>
                </div>
              </div>

              <form onSubmit={saveSecurity} className="space-y-5">
                <FieldGroup className="grid gap-5 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                    <Input id="currentPassword" type="password" {...securityForm.register("currentPassword")} />
                    <FieldError errors={[securityForm.formState.errors.currentPassword]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                    <Input id="newPassword" type="password" {...securityForm.register("newPassword")} />
                    <FieldError errors={[securityForm.formState.errors.newPassword]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                    <Input id="confirmPassword" type="password" {...securityForm.register("confirmPassword")} />
                    <FieldError errors={[securityForm.formState.errors.confirmPassword]} />
                  </Field>
                </FieldGroup>

                <Button type="submit" className="rounded-full bg-white text-zinc-950 hover:bg-cyan-100">
                  <Save className="size-4" />
                  Save Security
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] py-0 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <CardContent className="px-6 py-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <Bell className="size-5 text-cyan-300" />
                    <h2 className="text-2xl font-semibold text-white">Notifications</h2>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Choose which email updates should reach you.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: "Email notifications",
                    description: "Receive membership, referral, and account updates.",
                    value: emailNotifications,
                    onChange: setEmailNotifications,
                  },
                  {
                    label: "Deal alerts",
                    description: "Get notified when premium deals drop in your area.",
                    value: dealAlerts,
                    onChange: setDealAlerts,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.onChange(!item.value)}
                      className={`inline-flex h-8 w-14 items-center rounded-full p-1 transition ${
                        item.value ? "bg-cyan-400" : "bg-zinc-700"
                      }`}
                      aria-pressed={item.value}
                    >
                      <span
                        className={`size-6 rounded-full bg-white transition-transform ${
                          item.value ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={saveNotifications}
                className="mt-6 rounded-full bg-white text-zinc-950 hover:bg-cyan-100"
              >
                <Save className="size-4" />
                Save Notifications
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-400/15 bg-[linear-gradient(180deg,rgba(48,18,22,0.88)_0%,rgba(15,11,13,0.98)_100%)] py-0 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <CardContent className="px-6 py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="size-5 text-red-300" />
                    <h2 className="text-2xl font-semibold text-white">Danger Zone</h2>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                    Deleting your account is irreversible. Your saved deals,
                    wallet activity, and referral progress will be permanently removed.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="rounded-full"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This action cannot be undone. Are you sure you want to request account deletion?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
