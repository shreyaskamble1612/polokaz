"use client";

import { useMemo, useState } from "react";
import { CircleCheckBig } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import useSWR from "swr";
import { clientFetch } from "@/lib/api/client-fetch";
import { Loader2 } from "lucide-react";

type PayoutStatus = "pending" | "approved" | "paid";
type PayoutTier = "free" | "basic" | "gold" | "merchant";

type Payout = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  tier: PayoutTier;
  amount: number;
  commissions: number;
  status: PayoutStatus;
};

function tierBadge(tier: string) {
  return tier === "gold" ? (
    <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Gold</Badge>
  ) : tier === "basic" ? (
    <Badge className="rounded-full bg-cyan-500/14 text-cyan-700 hover:bg-cyan-500/14">Basic</Badge>
  ) : tier === "merchant" ? (
    <Badge className="rounded-full bg-violet-500/14 text-violet-700 hover:bg-violet-500/14">Merchant</Badge>
  ) : (
    <Badge variant="secondary" className="rounded-full">Free</Badge>
  );
}

function statusBadge(status: PayoutStatus) {
  switch (status) {
    case "pending":
      return <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Pending</Badge>;
    case "approved":
      return <Badge className="rounded-full bg-cyan-500/14 text-cyan-700 hover:bg-cyan-500/14">Approved</Badge>;
    default:
      return <Badge className="rounded-full bg-emerald-500/14 text-emerald-700 hover:bg-emerald-500/14">Paid</Badge>;
  }
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function Page() {
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "all">("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePayout, setActivePayout] = useState<Payout | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<any>(
    `/api/admin/payouts?status=${statusFilter === "all" ? "" : statusFilter}`,
    clientFetch
  );

  const filteredPayouts = useMemo(() => data?.payouts || [], [data]);

  const handleApprovePayout = async (payout: Payout) => {
    try {
      await clientFetch(`/api/admin/payouts/${payout.userId}/approve`, {
        method: "POST",
      });
      setToast(`Approved payout for ${payout.userName}`);
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to approve payout");
    }
  };

  const approveSelected = async () => {
    try {
      await Promise.all(
        selectedIds.map((userId) =>
          clientFetch(`/api/admin/payouts/${userId}/approve`, {
            method: "POST",
          })
        )
      );
      setToast(`Approved ${selectedIds.length} payouts`);
      setSelectedIds([]);
      setBatchModalOpen(false);
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to approve selected payouts");
    }
  };

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <h2 className="text-2xl font-bold">Failed to load payouts</h2>
        <p className="mt-2 text-sm">{error.message || "Please make sure you have administrator privileges."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{toast}</div> : null}

      <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl tracking-tight">Payout Management</CardTitle>
          <CardDescription>Approve pending commissions and reconcile paid batches.</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PayoutStatus | "all")}>
          <SelectTrigger className="h-12 w-[220px] rounded-2xl bg-white">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => setBatchModalOpen(true)}
          className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
          disabled={selectedIds.length === 0}
        >
          <CircleCheckBig className="mr-2 h-4 w-4" />
          Approve Selected ({selectedIds.length})
        </Button>
      </div>

      <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading payouts...
            </div>
          ) : filteredPayouts.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      aria-label="Select all payouts"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredPayouts.length}
                      onChange={(event) =>
                        setSelectedIds(event.target.checked ? filteredPayouts.map((payout: any) => payout.userId) : [])
                      }
                    />
                  </TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Pending Amount</TableHead>
                  <TableHead>Number of Commissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout: any) => (
                  <TableRow key={payout.userId}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Select payout for ${payout.userName}`}
                        checked={selectedIds.includes(payout.userId)}
                        onChange={(event) => {
                          setSelectedIds((current) =>
                            event.target.checked ? [...current, payout.userId] : current.filter((id) => id !== payout.userId),
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-950">{payout.userName}</TableCell>
                    <TableCell>{payout.email}</TableCell>
                    <TableCell>{tierBadge(payout.tier)}</TableCell>
                    <TableCell>{money(payout.amount)}</TableCell>
                    <TableCell>{payout.commissions}</TableCell>
                    <TableCell>{statusBadge(payout.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {payout.status === "pending" ? (
                          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setActivePayout(payout)}>
                            Approve Payout
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-500 italic pr-3">No actions</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center p-6 text-sm text-slate-500">
              {statusFilter === "pending" ? (
                <>
                  <p className="font-semibold text-slate-700">No pending payouts.</p>
                  <p className="mt-1 text-xs text-slate-500">All commissions have been processed.</p>
                </>
              ) : (
                <p>No payouts found matching filters.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(activePayout)} onOpenChange={(open) => !open && setActivePayout(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve payout</DialogTitle>
            <DialogDescription>
              Confirm the payout of {activePayout ? money(activePayout.amount) : "$0"} for {activePayout?.userName ?? "this user"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivePayout(null)} className="rounded-full">
              Cancel
            </Button>
            <Button
              className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
              onClick={() => {
                if (activePayout) handleApprovePayout(activePayout);
                setActivePayout(null);
              }}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve selected payouts</DialogTitle>
            <DialogDescription>
              Approve {selectedIds.length} selected payout(s) now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchModalOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button className="rounded-full bg-slate-950 text-white hover:bg-slate-800" onClick={approveSelected}>
              Confirm Batch Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

