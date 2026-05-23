"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Ban, Search, UserCog } from "lucide-react";

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

type UserRole = "admin" | "merchant" | "customer";
type UserTier = "free" | "basic" | "gold";
type UserStatus = "active" | "banned";
type SortKey = "name" | "email" | "role" | "tier" | "joinedAt";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  joinedAt: string;
  status: UserStatus;
  country: string;
};

const INITIAL_USERS: AdminUser[] = Array.from({ length: 25 }).map((_, index) => {
  const roles: UserRole[] = ["customer", "merchant", "customer", "admin"];
  const tiers: UserTier[] = ["free", "basic", "gold", "basic", "free"];
  const statuses: UserStatus[] = ["active", "active", "active", "banned", "active"];
  const names = ["Ava", "Noah", "Sophia", "Liam", "Mia", "Ethan", "Zoe", "Lucas", "Aria", "Mason"];

  return {
    id: `user-${index + 1}`,
    name: `${names[index % names.length]} ${String.fromCharCode(65 + (index % 26))}.`,
    email: `user${index + 1}@polokaz.com`,
    role: roles[index % roles.length],
    tier: tiers[index % tiers.length],
    joinedAt: `2026-0${(index % 9) + 1}-${String((index % 27) + 1).padStart(2, "0")}`,
    status: statuses[index % statuses.length],
    country: ["United States", "Canada", "Mexico", "United Kingdom"][index % 4],
  };
});

function tierBadge(tier: UserTier) {
  switch (tier) {
    case "gold":
      return <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Gold</Badge>;
    case "basic":
      return <Badge className="rounded-full bg-cyan-500/14 text-cyan-700 hover:bg-cyan-500/14">Basic</Badge>;
    default:
      return <Badge variant="secondary" className="rounded-full">Free</Badge>;
  }
}

function roleBadge(role: UserRole) {
  switch (role) {
    case "admin":
      return <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">Admin</Badge>;
    case "merchant":
      return <Badge className="rounded-full bg-violet-500/14 text-violet-700 hover:bg-violet-500/14">Merchant</Badge>;
    default:
      return <Badge variant="outline" className="rounded-full">Customer</Badge>;
  }
}

function statusBadge(status: UserStatus) {
  return status === "active" ? (
    <Badge className="rounded-full bg-emerald-500/14 text-emerald-700 hover:bg-emerald-500/14">Active</Badge>
  ) : (
    <Badge className="rounded-full bg-rose-500/14 text-rose-700 hover:bg-rose-500/14">Banned</Badge>
  );
}

export default function Page() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [viewedUser, setViewedUser] = useState<AdminUser | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [targetTier, setTargetTier] = useState<UserTier>("basic");
  const [pendingTierChange, setPendingTierChange] = useState<{ user: AdminUser; tier: UserTier } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, tierFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    const normalized = search.toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalized ||
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesTier = tierFilter === "all" || user.tier === tierFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesTier && matchesStatus;
    });
  }, [users, search, roleFilter, tierFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((left, right) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      const leftValue = String(left[sortKey]);
      const rightValue = String(right[sortKey]);
      return leftValue.localeCompare(rightValue) * direction;
    });
  }, [filteredUsers, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / 10));
  const paginatedUsers = sortedUsers.slice((page - 1) * 10, page * 10);

  const updateUser = (userId: string, patch: Partial<AdminUser>) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, ...patch } : user)));
  };

  const confirmManualTier = () => {
    if (!targetUserId) return;
    updateUser(targetUserId, { tier: targetTier });
    setManualModalOpen(false);
  };

  const confirmRowTierChange = () => {
    if (!pendingTierChange) return;
    updateUser(pendingTierChange.user.id, { tier: pendingTierChange.tier });
    setPendingTierChange(null);
  };

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
                <SelectItem value="gold">Gold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 rounded-2xl bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  ["name", "Name"],
                  ["email", "Email"],
                  ["role", "Role"],
                  ["tier", "Tier"],
                  ["joinedAt", "Joined Date"],
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-slate-950">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roleBadge(user.role)}</TableCell>
                  <TableCell>{tierBadge(user.tier)}</TableCell>
                  <TableCell>{new Date(user.joinedAt).toLocaleDateString("en-US")}</TableCell>
                  <TableCell>{statusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setViewedUser(user)}>
                        View Profile
                      </Button>
                      <Select
                        value={user.tier}
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
                          <SelectItem value="gold">Gold</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant={user.status === "active" ? "destructive" : "default"}
                        size="sm"
                        className="rounded-full"
                        onClick={() => updateUser(user.id, { status: user.status === "active" ? "banned" : "active" })}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        {user.status === "active" ? "Ban" : "Unban"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {paginatedUsers.length} of {sortedUsers.length} filtered users.
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
            <div className="space-y-3 text-sm">
              <p><span className="font-semibold">Name:</span> {viewedUser.name}</p>
              <p><span className="font-semibold">Email:</span> {viewedUser.email}</p>
              <p><span className="font-semibold">Role:</span> {viewedUser.role}</p>
              <p><span className="font-semibold">Tier:</span> {viewedUser.tier}</p>
              <p><span className="font-semibold">Country:</span> {viewedUser.country}</p>
              <p><span className="font-semibold">Status:</span> {viewedUser.status}</p>
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
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
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
                  <SelectItem value="gold">Gold</SelectItem>
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

      <Dialog open={Boolean(pendingTierChange)} onOpenChange={(open) => !open && setPendingTierChange(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Tier Change</DialogTitle>
            <DialogDescription>
              Update {pendingTierChange?.user.name ?? "this user"} to {pendingTierChange?.tier ?? "selected tier"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTierChange(null)} className="rounded-full">
              Cancel
            </Button>
            <Button className="rounded-full bg-slate-950 text-white hover:bg-slate-800" onClick={confirmRowTierChange}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
