"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Ban, Search, UserCog, Loader2, MoreHorizontal, Settings, ShieldAlert, Award, Play, Scale } from "lucide-react";
import useSWR from "swr";
import { clientFetch } from "@/lib/api/client-fetch";
import { authClient } from "@polokaz/auth/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

type UserRole = "admin" | "merchant" | "customer";
type UserTier = "free" | "basic" | "gold" | "merchant" | "regular" | "premium" | "organization" | "small_vendor" | "premium_vendor";
type UserStatus = "active" | "banned";
type SortKey = "name" | "email" | "role" | "tier" | "createdAt";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  stripeSubscriptionId?: string | null;
  createdAt: string;
  banned: boolean;
  referralCount: number;
  status: "active" | "suspended" | "cancelled" | "terminated" | "under_review";
  setupFeeWaived: boolean;
  lastLoginAt?: string | null;
  cancellationReason?: string | null;
  suspensionReason?: string | null;
  suspensionNotes?: string | null;
  terminationReason?: string | null;
};

function tierBadge(tier: string) {
  switch (tier) {
    case "gold":
      return <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Gold</Badge>;
    case "basic":
      return <Badge className="rounded-full bg-slate-500/14 text-slate-700 hover:bg-slate-500/14">Basic</Badge>;
    case "regular":
      return <Badge className="rounded-full bg-sky-500/14 text-sky-700 hover:bg-sky-500/14">Regular</Badge>;
    case "premium":
      return <Badge className="rounded-full bg-indigo-500/14 text-indigo-700 hover:bg-indigo-500/14">Premium</Badge>;
    case "organization":
      return <Badge className="rounded-full bg-pink-500/14 text-pink-700 hover:bg-pink-500/14">Organization</Badge>;
    case "small_vendor":
      return <Badge className="rounded-full bg-violet-500/14 text-violet-700 hover:bg-violet-500/14">Small Vendor</Badge>;
    case "premium_vendor":
      return <Badge className="rounded-full bg-fuchsia-500/14 text-fuchsia-700 hover:bg-fuchsia-500/14">Premium Vendor</Badge>;
    case "merchant":
      return <Badge className="rounded-full bg-violet-500/14 text-violet-700 hover:bg-violet-500/14">Merchant</Badge>;
    default:
      return <Badge variant="secondary" className="rounded-full">Free</Badge>;
  }
}

function roleBadge(role: string) {
  switch (role) {
    case "super_admin":
      return <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">Super Admin</Badge>;
    case "admin":
      return <Badge className="rounded-full bg-slate-800 text-white hover:bg-slate-800">Admin</Badge>;
    case "merchant":
      return <Badge className="rounded-full bg-violet-500/14 text-violet-700 hover:bg-violet-500/14">Merchant</Badge>;
    default:
      return <Badge variant="outline" className="rounded-full">Customer</Badge>;
  }
}

function statusBadge(status?: string | null) {
  const normalized = (status || "active").toLowerCase();
  switch (normalized) {
    case "active":
      return <Badge className="rounded-full bg-emerald-500/14 text-emerald-700 hover:bg-emerald-500/14">Active</Badge>;
    case "suspended":
      return <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Suspended</Badge>;
    case "cancelled":
      return <Badge className="rounded-full bg-slate-500/14 text-slate-700 hover:bg-slate-500/14">Cancelled</Badge>;
    case "terminated":
      return <Badge className="rounded-full bg-rose-500/14 text-rose-700 hover:bg-rose-500/14">Terminated</Badge>;
    case "under_review":
      return <Badge className="rounded-full bg-indigo-500/14 text-indigo-700 hover:bg-indigo-500/14">Review</Badge>;
    default:
      return <Badge variant="outline" className="rounded-full">{status}</Badge>;
  }
}

export default function Page() {
  const { data: session } = authClient.useSession();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [viewedUser, setViewedUser] = useState<AdminUser | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [targetTier, setTargetTier] = useState<UserTier>("basic");
  const [pendingTierChange, setPendingTierChange] = useState<{ user: AdminUser; tier: UserTier } | null>(null);

  // New Moderation States
  const [suspensionUser, setSuspensionUser] = useState<AdminUser | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("Payment Dispute");
  const [suspensionNotes, setSuspensionNotes] = useState("");

  const [cancellationUser, setCancellationUser] = useState<AdminUser | null>(null);
  const [cancellationReason, setCancellationReason] = useState("Voluntary");
  const [cancellationNotes, setCancellationNotes] = useState("");
  const [cancellationImmediate, setCancellationImmediate] = useState(false);

  const [terminationUser, setTerminationUser] = useState<AdminUser | null>(null);
  const [terminationReason, setTerminationReason] = useState("TOS Violation");
  const [terminationNotes, setTerminationNotes] = useState("");

  const [reviewUser, setReviewUser] = useState<AdminUser | null>(null);
  const [reviewReason, setReviewReason] = useState("Fraud Investigation");
  const [reviewNotes, setReviewNotes] = useState("");

  const [rewardUser, setRewardUser] = useState<AdminUser | null>(null);
  const [rewardType, setRewardType] = useState<"points" | "commission">("points");
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardReason, setRewardReason] = useState("");

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "10",
    role: roleFilter,
    tier: tierFilter,
    status: statusFilter,
    search: search,
  });

  const { data, error, isLoading, mutate } = useSWR<any>(
    `/api/admin/users?${queryParams.toString()}`,
    clientFetch
  );

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, tierFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const rawUsers = data?.users || [];
    return [...rawUsers].sort((left, right) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      const leftValue = String(left[sortKey] || "");
      const rightValue = String(right[sortKey] || "");
      return leftValue.localeCompare(rightValue) * direction;
    });
  }, [data, sortDirection, sortKey]);

  const totalPages = data?.totalPages || 1;
  const totalUsersCount = data?.total || 0;

  const handleTierChange = async (userId: string, tier: string) => {
    try {
      await clientFetch(`/api/admin/member/${userId}/tier`, {
        method: "PUT",
        body: JSON.stringify({ new_tier: tier }),
      });
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to update tier");
    }
  };

  const handleSuspend = async () => {
    if (!suspensionUser) return;
    try {
      await clientFetch(`/api/admin/member/${suspensionUser.id}/suspend`, {
        method: "PUT",
        body: JSON.stringify({ reason: suspensionReason, notes: suspensionNotes }),
      });
      setSuspensionUser(null);
      setSuspensionReason("Payment Dispute");
      setSuspensionNotes("");
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to suspend member");
    }
  };

  const handleReinstate = async (userObj: AdminUser) => {
    try {
      await clientFetch(`/api/admin/member/${userObj.id}/reinstate`, {
        method: "PUT",
      });
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to reinstate member");
    }
  };

  const handleCancel = async () => {
    if (!cancellationUser) return;
    try {
      await clientFetch(`/api/admin/member/${cancellationUser.id}/cancel`, {
        method: "PUT",
        body: JSON.stringify({
          reason: cancellationReason,
          notes: cancellationNotes,
          immediate: cancellationImmediate,
        }),
      });
      setCancellationUser(null);
      setCancellationReason("Voluntary");
      setCancellationNotes("");
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to cancel membership");
    }
  };

  const handleTerminate = async () => {
    if (!terminationUser) return;
    try {
      await clientFetch(`/api/admin/member/${terminationUser.id}/terminate`, {
        method: "PUT",
        body: JSON.stringify({ reason: terminationReason, notes: terminationNotes }),
      });
      setTerminationUser(null);
      setTerminationReason("TOS Violation");
      setTerminationNotes("");
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to terminate member");
    }
  };

  const handleReview = async () => {
    if (!reviewUser) return;
    try {
      await clientFetch(`/api/admin/member/${reviewUser.id}/review`, {
        method: "PUT",
        body: JSON.stringify({ reason: reviewReason, notes: reviewNotes }),
      });
      setReviewUser(null);
      setReviewReason("Fraud Investigation");
      setReviewNotes("");
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to place under review");
    }
  };

  const handleToggleFeeWaive = async (userObj: AdminUser) => {
    try {
      await clientFetch(`/api/admin/member/${userObj.id}/waive-fee`, {
        method: "PUT",
        body: JSON.stringify({ waive: !userObj.setupFeeWaived }),
      });
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to waive signup fee");
    }
  };

  const handleGrantReward = async () => {
    if (!rewardUser) return;
    try {
      await clientFetch(`/api/admin/member/${rewardUser.id}/grant-reward`, {
        method: "POST",
        body: JSON.stringify({ rewardType, amount: Number(rewardAmount), reason: rewardReason }),
      });
      setRewardUser(null);
      setRewardAmount(0);
      setRewardReason("");
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to grant reward");
    }
  };

  const confirmManualTier = async () => {
    if (!targetUserId) return;
    await handleTierChange(targetUserId, targetTier);
    setManualModalOpen(false);
  };

  const confirmRowTierChange = async () => {
    if (!pendingTierChange) return;
    await handleTierChange(pendingTierChange.user.id, pendingTierChange.tier);
    setPendingTierChange(null);
  };

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <h2 className="text-2xl font-bold">Failed to load user manager</h2>
        <p className="mt-2 text-sm">{error.message || "Please make sure you have administrator privileges."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">User Management</CardTitle>
            <CardDescription>
              Search, sort, paginate, and moderate users across the Polokaz platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2 xl:col-span-1">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users"
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </label>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-12 rounded-2xl bg-white">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="h-12 rounded-2xl bg-white">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="small_vendor">Small Vendor</SelectItem>
                <SelectItem value="premium_vendor">Premium Vendor</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 rounded-2xl bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">Manual Tier Upgrade</CardTitle>
            <CardDescription>
              Pick a user, choose a tier, and confirm the change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setManualModalOpen(true)}
              className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
            >
              <UserCog className="mr-2 h-4 w-4" />
              Open tier editor
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl tracking-tight">All Users</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} with 10 users per page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : paginatedUsers.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    ["name", "Name"],
                    ["email", "Email"],
                    ["role", "Role"],
                    ["tier", "Tier"],
                    ["createdAt", "Joined Date"],
                  ].map(([key, label]) => (
                    <TableHead key={key}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium"
                        onClick={() => {
                          const nextKey = key as SortKey;
                          setSortKey(nextKey);
                          setSortDirection((current) => (sortKey === nextKey && current === "asc" ? "desc" : "asc"));
                        }}
                      >
                        {label}
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </TableHead>
                  ))}
                  <TableHead>Referrals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user: AdminUser) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-slate-950">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{roleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {tierBadge(user.tier)}
                        {user.stripeSubscriptionId && (
                          <Badge variant="outline" className="rounded-full bg-indigo-50 text-indigo-700 border-indigo-200/50 text-[10px] px-1.5 py-0">Stripe</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString("en-US")}</TableCell>
                    <TableCell>{user.referralCount || 0}</TableCell>
                    <TableCell>{statusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setViewedUser(user)}>
                          Profile
                        </Button>
                        
                        <Select
                          value={user.tier}
                          disabled={!!user.stripeSubscriptionId}
                          onValueChange={(value) =>
                            setPendingTierChange({ user, tier: value as UserTier })
                          }
                        >
                          <SelectTrigger className="h-9 w-[110px] rounded-full">
                            <SelectValue placeholder="Tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="organization">Organization</SelectItem>
                            <SelectItem value="small_vendor">Small Vendor</SelectItem>
                            <SelectItem value="premium_vendor">Premium Vendor</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="merchant">Merchant</SelectItem>
                          </SelectContent>
                        </Select>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-slate-200">
                            <DropdownMenuLabel>Moderation Controls</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {user.status !== "suspended" && user.status !== "terminated" && (
                              <DropdownMenuItem className="text-amber-600 focus:text-amber-700" onClick={() => setSuspensionUser(user)}>
                                Suspend Account
                              </DropdownMenuItem>
                            )}

                            {user.status !== "cancelled" && user.status !== "terminated" && (
                              <DropdownMenuItem className="text-slate-700" onClick={() => setCancellationUser(user)}>
                                Cancel Membership
                              </DropdownMenuItem>
                            )}

                            {user.status !== "terminated" && (
                              <DropdownMenuItem 
                                className="text-rose-600 focus:text-rose-700" 
                                onClick={() => {
                                  if (session?.user?.role === "super_admin") {
                                    setTerminationUser(user);
                                  } else {
                                    setReviewUser(user);
                                  }
                                }}
                              >
                                {session?.user?.role === "super_admin" ? "Terminate Account (Ban)" : "Flag for Super Admin review"}
                              </DropdownMenuItem>
                            )}

                            {user.status !== "active" && (user.status !== "terminated" || session?.user?.role === "super_admin") && (
                              <DropdownMenuItem className="text-emerald-600 focus:text-emerald-700" onClick={() => handleReinstate(user)}>
                                Reinstate Account
                              </DropdownMenuItem>
                            )}

                            {user.status === "active" && (
                              <DropdownMenuItem className="text-indigo-600 focus:text-indigo-700" onClick={() => setReviewUser(user)}>
                                Place Under Investigation
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleToggleFeeWaive(user)}>
                              {user.setupFeeWaived ? "Charge setup fee" : "Waive signup fee"}
                              {user.setupFeeWaived && <Badge variant="outline" className="ml-2 bg-cyan-50 border-cyan-200 text-[10px]">Waived</Badge>}
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-purple-600 focus:text-purple-700" onClick={() => setRewardUser(user)}>
                              Grant Points/Commissions
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No users found matching filters.
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {paginatedUsers.length} of {totalUsersCount} filtered users.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-full"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-full"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(viewedUser)} onOpenChange={(open) => !open && setViewedUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Admin-facing profile summary and status.</DialogDescription>
          </DialogHeader>
          {viewedUser ? (
            <div className="space-y-3 text-sm text-slate-900">
              <p><span className="font-semibold">ID:</span> {viewedUser.id}</p>
              <p><span className="font-semibold">Name:</span> {viewedUser.name}</p>
              <p><span className="font-semibold">Email:</span> {viewedUser.email}</p>
              <p><span className="font-semibold">Role:</span> {viewedUser.role}</p>
              <p><span className="font-semibold">Tier:</span> {viewedUser.tier}</p>
              <p><span className="font-semibold">Referrals Count:</span> {viewedUser.referralCount || 0}</p>
              <p><span className="font-semibold">Status:</span> {statusBadge(viewedUser.status)}</p>
              {viewedUser.setupFeeWaived && <p><span className="font-semibold">Setup Fee:</span> Waived</p>}
              {viewedUser.lastLoginAt && <p><span className="font-semibold">Last Login:</span> {new Date(viewedUser.lastLoginAt).toLocaleString()}</p>}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewedUser(null)} className="rounded-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manually Upgrade Tier</DialogTitle>
            <DialogDescription>
              Select a user and a target tier to confirm the upgrade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>User</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Choose user" />
                </SelectTrigger>
                <SelectContent>
                  {(data?.users || []).map((user: any) => (
                    <SelectItem key={user.id} value={user.id} disabled={!!user.stripeSubscriptionId}>
                      {user.name} ({user.email}){user.stripeSubscriptionId ? " (Paid via Stripe)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tier</Label>
              <Select value={targetTier} onValueChange={(value) => setTargetTier(value as UserTier)}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="small_vendor">Small Vendor</SelectItem>
                  <SelectItem value="premium_vendor">Premium Vendor</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="merchant">Merchant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualModalOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={confirmManualTier} className="rounded-full bg-slate-950 text-white hover:bg-slate-800">
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={Boolean(suspensionUser)} onOpenChange={(open) => !open && setSuspensionUser(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Suspend Member Account</DialogTitle>
            <DialogDescription>
              Temporarily lock {suspensionUser?.name}&apos;s account access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Suspension Reason</Label>
              <Select value={suspensionReason} onValueChange={setSuspensionReason}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Payment Dispute">Payment Dispute</SelectItem>
                  <SelectItem value="Rule Violation">Rule Violation</SelectItem>
                  <SelectItem value="Fraud Investigation">Fraud Investigation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Details of suspension..."
                value={suspensionNotes}
                onChange={(e) => setSuspensionNotes(e.target.value)}
                className="rounded-2xl min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspensionUser(null)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleSuspend} className="rounded-full bg-amber-600 text-white hover:bg-amber-700">
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancellationUser)} onOpenChange={(open) => !open && setCancellationUser(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Cancel Membership</DialogTitle>
            <DialogDescription>
              Terminate subscription and active residuals for {cancellationUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Cancellation Reason</Label>
              <Select value={cancellationReason} onValueChange={setCancellationReason}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Voluntary">Voluntary / Member-requested</SelectItem>
                  <SelectItem value="Non-Payment">Non-payment (Stripe failure)</SelectItem>
                  <SelectItem value="Rule Violation">Rule violation</SelectItem>
                  <SelectItem value="Inactivity">Inactivity</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Reason details..."
                value={cancellationNotes}
                onChange={(e) => setCancellationNotes(e.target.value)}
                className="rounded-2xl min-h-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="immediate-cancel"
                type="checkbox"
                checked={cancellationImmediate}
                onChange={(e) => setCancellationImmediate(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500"
              />
              <Label htmlFor="immediate-cancel" className="cursor-pointer">Cancel immediately (instead of end of period)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellationUser(null)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleCancel} className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(terminationUser)} onOpenChange={(open) => !open && setTerminationUser(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Permanently Terminate Member Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent, deactivates the Trackdesk affiliate profile, blocks their email, and forfeits all pending commissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Termination Reason</Label>
              <Select value={terminationReason} onValueChange={setTerminationReason}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fraud">Fraud / Fake Referrals</SelectItem>
                  <SelectItem value="Harassment">Harassment</SelectItem>
                  <SelectItem value="TOS Violation">TOS Violation</SelectItem>
                  <SelectItem value="Financial Abuse">Financial Abuse</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes / Evidence (Mandatory)</Label>
              <Textarea
                placeholder="Provide details/evidence for permanent ban..."
                value={terminationNotes}
                onChange={(e) => setTerminationNotes(e.target.value)}
                className="rounded-2xl min-h-24 border-red-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminationUser(null)} className="rounded-full">
              Cancel
            </Button>
            <Button 
              onClick={handleTerminate} 
              disabled={!terminationNotes.trim()}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              Confirm Permanent Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reviewUser)} onOpenChange={(open) => !open && setReviewUser(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Place Under Investigation</DialogTitle>
            <DialogDescription>
              Restrict {reviewUser?.name}&apos;s account capabilities while keeping them active.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Investigation Category</Label>
              <Select value={reviewReason} onValueChange={setReviewReason}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fraud Investigation">Referral Fraud Suspected</SelectItem>
                  <SelectItem value="Chargeback Warning">Chargeback / Payment Dispute</SelectItem>
                  <SelectItem value="TOS Audit">TOS Audit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Details of audit..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="rounded-2xl min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewUser(null)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleReview} className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700">
              Submit Review Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rewardUser)} onOpenChange={(open) => !open && setRewardUser(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Override & Grant Reward Manually
            </DialogTitle>
            <DialogDescription>
              Directly grant points or cash commissions to {rewardUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Reward Type</Label>
                <Select value={rewardType} onValueChange={(v) => setRewardType(v as any)}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points Ledger</SelectItem>
                    <SelectItem value="commission">Cash Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={rewardAmount || ""}
                  onChange={(e) => setRewardAmount(Number(e.target.value))}
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Grant Reason (Required)</Label>
              <Input
                placeholder="e.g. Customer support bonus / manual override"
                value={rewardReason}
                onChange={(e) => setRewardReason(e.target.value)}
                className="rounded-2xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardUser(null)} className="rounded-full">
              Cancel
            </Button>
            <Button 
              onClick={handleGrantReward} 
              disabled={!rewardReason.trim() || rewardAmount <= 0}
              className="rounded-full bg-purple-600 text-white hover:bg-purple-700"
            >
              Grant Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
