"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleX, Filter, Search } from "lucide-react";

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

type DealStatus = "active" | "pending" | "paused" | "rejected";
type DealType = "coupon" | "voucher" | "loyalty";

type AdminDeal = {
  id: string;
  title: string;
  merchantName: string;
  type: DealType;
  submittedAt: string;
  status: DealStatus;
  category: string;
  notes?: string;
};

const INITIAL_PENDING_QUEUE: AdminDeal[] = [
  { id: "d1", title: "20% Off Dinner", merchantName: "Velvet Table", type: "coupon", submittedAt: "2026-05-12", status: "pending", category: "Food & Dining" },
  { id: "d2", title: "$40 Spa Voucher", merchantName: "Serene Skin", type: "voucher", submittedAt: "2026-05-12", status: "pending", category: "Health & Wellness" },
  { id: "d3", title: "Loyalty Punch Booster", merchantName: "Coffee Lab", type: "loyalty", submittedAt: "2026-05-11", status: "pending", category: "Food & Dining" },
  { id: "d4", title: "Weekend Brunch Credit", merchantName: "Harbor & Honey", type: "voucher", submittedAt: "2026-05-10", status: "pending", category: "Food & Dining" },
  { id: "d5", title: "Retail Launch Promo", merchantName: "Northline Atelier", type: "coupon", submittedAt: "2026-05-10", status: "pending", category: "Retail" },
];

const INITIAL_ALL_DEALS: AdminDeal[] = [
  ...INITIAL_PENDING_QUEUE,
  { id: "d6", title: "Private Cinema Pass", merchantName: "Luma House", type: "voucher", submittedAt: "2026-05-08", status: "active", category: "Entertainment" },
  { id: "d7", title: "Concert Loyalty Perk", merchantName: "Echo Arena", type: "loyalty", submittedAt: "2026-05-04", status: "active", category: "Entertainment" },
  { id: "d8", title: "Hotel Stay Credit", merchantName: "Azure Cove", type: "voucher", submittedAt: "2026-05-03", status: "paused", category: "Travel" },
  { id: "d9", title: "Eyewear Savings", merchantName: "Glass District", type: "coupon", submittedAt: "2026-05-02", status: "active", category: "Retail" },
  { id: "d10", title: "Arcade Night Bonus", merchantName: "Neon Circuit", type: "coupon", submittedAt: "2026-05-01", status: "rejected", category: "Entertainment", notes: "Branding mismatch" },
];

function statusBadge(status: DealStatus) {
  switch (status) {
    case "active":
      return <Badge className="rounded-full bg-emerald-500/14 text-emerald-700 hover:bg-emerald-500/14">Active</Badge>;
    case "pending":
      return <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Pending</Badge>;
    case "paused":
      return <Badge variant="secondary" className="rounded-full">Paused</Badge>;
    default:
      return <Badge className="rounded-full bg-rose-500/14 text-rose-700 hover:bg-rose-500/14">Rejected</Badge>;
  }
}

function typeBadge(type: DealType) {
  const label = type === "coupon" ? "Coupon" : type === "voucher" ? "Voucher" : "Loyalty";
  const className = type === "coupon" ? "bg-cyan-500/14 text-cyan-700" : type === "voucher" ? "bg-violet-500/14 text-violet-700" : "bg-amber-500/14 text-amber-700";
  return <Badge className={`rounded-full hover:bg-transparent ${className}`}>{label}</Badge>;
}

export default function Page() {
  const [pendingDeals, setPendingDeals] = useState(INITIAL_PENDING_QUEUE);
  const [allDeals, setAllDeals] = useState(INITIAL_ALL_DEALS);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [statusFilter, setStatusFilter] = useState<DealStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [rejectingDeal, setRejectingDeal] = useState<AdminDeal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const visibleAllDeals = useMemo(() => {
    const normalized = search.toLowerCase();
    return allDeals.filter((deal) => {
      const matchesSearch = !normalized || deal.title.toLowerCase().includes(normalized) || deal.merchantName.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allDeals, search, statusFilter]);

  const approveDeal = (deal: AdminDeal) => {
    setPendingDeals((current) => current.filter((item) => item.id !== deal.id));
    setAllDeals((current) => current.map((item) => (item.id === deal.id ? { ...item, status: "active" } : item)));
    setToast(`Approved ${deal.title}`);
  };

  const submitRejection = () => {
    if (!rejectingDeal) return;
    setPendingDeals((current) => current.filter((item) => item.id !== rejectingDeal.id));
    setAllDeals((current) =>
      current.map((item) =>
        item.id === rejectingDeal.id ? { ...item, status: "rejected", notes: rejectReason } : item,
      ),
    );
    setToast(`Rejected ${rejectingDeal.title}`);
    setRejectingDeal(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{toast}</div>
      ) : null}

      <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl tracking-tight">Deal Moderation Queue</CardTitle>
          <CardDescription>Review submitted merchant deals before they go live.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "pending" | "all")}>
        <TabsList className="rounded-full border border-slate-200 bg-white p-1">
          <TabsTrigger value="pending" className="rounded-full px-5">Pending Review</TabsTrigger>
          <TabsTrigger value="all" className="rounded-full px-5">All Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Title</TableHead>
                    <TableHead>Merchant Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium text-slate-950">{deal.title}</TableCell>
                      <TableCell>{deal.merchantName}</TableCell>
                      <TableCell>{typeBadge(deal.type)}</TableCell>
                      <TableCell>{new Date(deal.submittedAt).toLocaleDateString("en-US")}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => approveDeal(deal)} className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button variant="destructive" className="rounded-full" onClick={() => setRejectingDeal(deal)}>
                            <CircleX className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DealStatus | "all")}>
                  <SelectTrigger className="h-12 rounded-2xl bg-white">
                    <Filter className="mr-2 h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                      <TableCell className="font-medium text-slate-950">{deal.title}</TableCell>
                      <TableCell>{deal.merchantName}</TableCell>
                      <TableCell>{typeBadge(deal.type)}</TableCell>
                      <TableCell>{statusBadge(deal.status)}</TableCell>
                      <TableCell>{new Date(deal.submittedAt).toLocaleDateString("en-US")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <Button variant="destructive" onClick={submitRejection} className="rounded-full">
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
