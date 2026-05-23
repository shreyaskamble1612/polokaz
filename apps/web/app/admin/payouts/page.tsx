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

type PayoutStatus = "pending" | "approved" | "paid";
type PayoutTier = "free" | "basic" | "gold";

type Payout = {
  id: string;
  userName: string;
  email: string;
  tier: PayoutTier;
  amount: number;
  commissions: number;
  status: PayoutStatus;
};

const INITIAL_PAYOUTS: Payout[] = [
  { id: "p1", userName: "Ava Johnson", email: "ava@polokaz.com", tier: "gold", amount: 840, commissions: 14, status: "pending" },
  { id: "p2", userName: "Noah Smith", email: "noah@polokaz.com", tier: "basic", amount: 420, commissions: 7, status: "pending" },
  { id: "p3", userName: "Mia Garcia", email: "mia@polokaz.com", tier: "gold", amount: 1120, commissions: 19, status: "approved" },
  { id: "p4", userName: "Liam Chen", email: "liam@polokaz.com", tier: "basic", amount: 300, commissions: 5, status: "paid" },
  { id: "p5", userName: "Zoe Patel", email: "zoe@polokaz.com", tier: "free", amount: 180, commissions: 3, status: "pending" },
  { id: "p6", userName: "Ethan Brown", email: "ethan@polokaz.com", tier: "gold", amount: 670, commissions: 11, status: "approved" },
  { id: "p7", userName: "Aria Lopez", email: "aria@polokaz.com", tier: "basic", amount: 240, commissions: 4, status: "pending" },
];

function tierBadge(tier: PayoutTier) {
  return tier === "gold" ? (
    <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Gold</Badge>
  ) : tier === "basic" ? (
    <Badge className="rounded-full bg-cyan-500/14 text-cyan-700 hover:bg-cyan-500/14">Basic</Badge>
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
  const [payouts, setPayouts] = useState(INITIAL_PAYOUTS);
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "all">("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePayout, setActivePayout] = useState<Payout | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filteredPayouts = useMemo(
    () => payouts.filter((payout) => statusFilter === "all" || payout.status === statusFilter),
    [payouts, statusFilter],
  );

  const approvePayout = (payout: Payout) => {
    setPayouts((current) => current.map((item) => (item.id === payout.id ? { ...item, status: "approved" } : item)));
    setToast(`Approved payout for ${payout.userName}`);
  };

  const approveSelected = () => {
    setPayouts((current) => current.map((item) => (selectedIds.includes(item.id) ? { ...item, status: "approved" } : item)));
    setSelectedIds([]);
    setBatchModalOpen(false);
    setToast(`Approved ${selectedIds.length} payouts`);
  };

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    aria-label="Select all payouts"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredPayouts.length}
                    onChange={(event) =>
                      setSelectedIds(event.target.checked ? filteredPayouts.map((payout) => payout.id) : [])
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
              {filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Select payout for ${payout.userName}`}
                      checked={selectedIds.includes(payout.id)}
                      onChange={(event) => {
                        setSelectedIds((current) =>
                          event.target.checked ? [...current, payout.id] : current.filter((id) => id !== payout.id),
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
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setActivePayout(payout)}>
                        Approve Payout
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                if (activePayout) approvePayout(activePayout);
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
