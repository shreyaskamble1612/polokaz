"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleX, Filter, Loader2, Search } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  approveAdminDeal,
  fetchAllAdminDeals,
  fetchPendingAdminDeals,
  rejectAdminDeal,
  type AdminModerationDeal,
} from "@/lib/api/admin-deals";

type DealStatus = AdminModerationDeal["status"];
type DealType = AdminModerationDeal["dealType"];

function statusBadge(status: DealStatus) {
  switch (status) {
    case "active":
      return <Badge className="rounded-full bg-emerald-500/14 text-emerald-700 hover:bg-emerald-500/14">Active</Badge>;
    case "pending_moderation":
      return <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Pending review</Badge>;
    case "inactive":
      return <Badge variant="secondary" className="rounded-full">Inactive</Badge>;
    default:
      return <Badge className="rounded-full bg-rose-500/14 text-rose-700 hover:bg-rose-500/14">Rejected</Badge>;
  }
}

function typeBadge(type: DealType) {
  const label = type === "coupon" ? "Coupon" : type === "voucher" ? "Voucher" : "Loyalty";
  const className =
    type === "coupon"
      ? "bg-cyan-500/14 text-cyan-700"
      : type === "voucher"
        ? "bg-violet-500/14 text-violet-700"
        : "bg-amber-500/14 text-amber-700";
  return <Badge className={`rounded-full hover:bg-transparent ${className}`}>{label}</Badge>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US");
}

export default function Page() {
  const [pendingDeals, setPendingDeals] = useState<AdminModerationDeal[]>([]);
  const [allDeals, setAllDeals] = useState<AdminModerationDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [statusFilter, setStatusFilter] = useState<DealStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [rejectingDeal, setRejectingDeal] = useState<AdminModerationDeal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDeals() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [pendingResponse, allResponse] = await Promise.all([
          fetchPendingAdminDeals(),
          fetchAllAdminDeals(),
        ]);

        if (!isMounted) return;

        setPendingDeals(pendingResponse.deals);
        setAllDeals(allResponse.deals);
      } catch (error) {
        if (!isMounted) return;

        setLoadError(error instanceof Error ? error.message : "Unable to load moderation queue");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleAllDeals = useMemo(() => {
    const normalized = search.toLowerCase();

    return allDeals.filter((deal) => {
      const matchesSearch =
        !normalized ||
        deal.title.toLowerCase().includes(normalized) ||
        (deal.businessName ?? "").toLowerCase().includes(normalized) ||
        (deal.ownerEmail ?? "").toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allDeals, search, statusFilter]);

  const approveDeal = async (deal: AdminModerationDeal) => {
    setActionId(deal.id);

    try {
      const response = await approveAdminDeal(deal.id);
      setPendingDeals((current) => current.filter((item) => item.id !== deal.id));
      setAllDeals((current) => current.map((item) => (item.id === deal.id ? { ...item, ...response.deal } : item)));
      setToast(`Approved ${deal.title}`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to approve deal");
    } finally {
      setActionId(null);
    }
  };

  const submitRejection = async () => {
    if (!rejectingDeal) return;

    const reason = rejectReason.trim();
    if (!reason) {
      setToast("Please provide a rejection reason");
      return;
    }

    setActionId(rejectingDeal.id);

    try {
      const response = await rejectAdminDeal(rejectingDeal.id, reason);
      setPendingDeals((current) => current.filter((item) => item.id !== rejectingDeal.id));
      setAllDeals((current) => current.map((item) => (item.id === rejectingDeal.id ? { ...item, ...response.deal } : item)));
      setToast(`Rejected ${rejectingDeal.title}`);
      setRejectingDeal(null);
      setRejectReason("");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to reject deal");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {loadError}
        </div>
      ) : null}

      {toast ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{toast}</div>
      ) : null}

      <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl tracking-tight">Deal Moderation Queue</CardTitle>
          <CardDescription>Review submitted merchant deals before they go live.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "pending" | "all") }>
        <TabsList className="rounded-full border border-slate-200 bg-white p-1">
          <TabsTrigger value="pending" className="rounded-full px-5">Pending Review</TabsTrigger>
          <TabsTrigger value="all" className="rounded-full px-5">All Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading moderation queue...
                </div>
              ) : pendingDeals.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Title</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDeals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium text-slate-950">{deal.title}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p>{deal.businessName ?? "Unknown merchant"}</p>
                            <p className="text-xs text-slate-500">{deal.ownerEmail ?? "No owner email"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{typeBadge(deal.dealType)}</TableCell>
                        <TableCell>{formatDate(deal.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => void approveDeal(deal)}
                              className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                              disabled={actionId === deal.id}
                            >
                              {actionId === deal.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              className="rounded-full"
                              onClick={() => setRejectingDeal(deal)}
                              disabled={actionId === deal.id}
                            >
                              <CircleX className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-950">No pending deals</p>
                  <p className="mt-1 max-w-md text-sm text-slate-500">All submitted deals have been reviewed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <CardContent className="pt-6">
              <div className="mb-4 grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search all deals"
                    className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DealStatus | "all") }>
                  <SelectTrigger className="h-12 rounded-2xl bg-white">
                    <Filter className="mr-2 h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_moderation">Pending review</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading all deals...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Title</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleAllDeals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium text-slate-950">
                          <div className="space-y-1">
                            <p>{deal.title}</p>
                            {deal.rejectionReason ? (
                              <p className="text-xs text-rose-700">Rejected: {deal.rejectionReason}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p>{deal.businessName ?? "Unknown merchant"}</p>
                            <p className="text-xs text-slate-500">{deal.ownerEmail ?? "No owner email"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{typeBadge(deal.dealType)}</TableCell>
                        <TableCell>{statusBadge(deal.status)}</TableCell>
                        <TableCell>{formatDate(deal.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(rejectingDeal)} onOpenChange={(open) => !open && setRejectingDeal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject deal</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {rejectingDeal?.title ?? "this deal"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="rejectReason">Reason</Label>
            <Textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Explain what needs to be fixed."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingDeal(null)} className="rounded-full">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void submitRejection()} className="rounded-full" disabled={actionId === rejectingDeal?.id}>
              {actionId === rejectingDeal?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
