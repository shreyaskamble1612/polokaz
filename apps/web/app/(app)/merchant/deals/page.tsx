"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Filter,
  Loader2,
  Pause,
  PenLine,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type DealStatus = "active" | "pending" | "paused";
type DealType = "coupon" | "voucher" | "loyalty";

type MerchantDeal = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: DealType;
  discountValue: number;
  expiryDate: string;
  status: DealStatus;
  redemptions: number;
  createdAt: string;
};

const dealSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Add a short description"),
  category: z.string().min(1, "Choose a category"),
  type: z.enum(["coupon", "voucher", "loyalty"]),
  discountValue: z.coerce.number().positive("Enter a discount value"),
  expiryDate: z.string().min(1, "Choose an expiry date"),
});

type DealFormValues = z.infer<typeof dealSchema>;
type DealFormInput = z.input<typeof dealSchema>;

const initialDeals: MerchantDeal[] = [
  {
    id: "deal-1",
    title: "Weekend Burger Combo",
    description: "BOGO burger deal for Friday through Sunday redemptions.",
    category: "Food & Beverage",
    type: "coupon",
    discountValue: 18,
    expiryDate: "2026-06-30",
    status: "active",
    redemptions: 148,
    createdAt: "2026-05-02",
  },
  {
    id: "deal-2",
    title: "Summer Spa Offer",
    description: "A relaxation package for wellness customers.",
    category: "Health & Wellness",
    type: "voucher",
    discountValue: 42,
    expiryDate: "2026-06-20",
    status: "pending",
    redemptions: 23,
    createdAt: "2026-05-05",
  },
  {
    id: "deal-3",
    title: "Coffee Loyalty Bonus",
    description: "Stamp-based reward for repeat coffee buyers.",
    category: "Food & Beverage",
    type: "loyalty",
    discountValue: 6.5,
    expiryDate: "2026-07-15",
    status: "paused",
    redemptions: 74,
    createdAt: "2026-04-28",
  },
  {
    id: "deal-4",
    title: "Travel Voucher Boost",
    description: "Seasonal travel offer for premium customers.",
    category: "Travel & Hospitality",
    type: "voucher",
    discountValue: 96,
    expiryDate: "2026-08-01",
    status: "active",
    redemptions: 42,
    createdAt: "2026-05-10",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadge(status: DealStatus) {
  switch (status) {
    case "active":
      return <Badge variant="success" className="rounded-full px-2.5 py-0.5">Active</Badge>;
    case "pending":
      return <Badge variant="warning" className="rounded-full px-2.5 py-0.5">Pending</Badge>;
    case "paused":
      return <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">Paused</Badge>;
  }
}

export default function Page() {
  const [deals, setDeals] = useState<MerchantDeal[]>(initialDeals);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DealType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DealStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const form = useForm<DealFormInput, unknown, DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      type: "coupon",
      discountValue: 0,
      expiryDate: "",
    },
  });

  const filteredDeals = useMemo(() => {
    const normalized = search.toLowerCase();

    return deals.filter((deal) => {
      const matchesSearch =
        !normalized ||
        deal.title.toLowerCase().includes(normalized) ||
        deal.description.toLowerCase().includes(normalized) ||
        deal.category.toLowerCase().includes(normalized);

      const matchesType = typeFilter === "all" || deal.type === typeFilter;
      const matchesStatus = statusFilter === "all" || deal.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [deals, search, typeFilter, statusFilter]);

  const openCreateDialog = () => {
    setEditingDealId(null);
    setSubmittedSuccess(false);
    form.reset({
      title: "",
      description: "",
      category: "",
      type: "coupon",
      discountValue: 0,
      expiryDate: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (deal: MerchantDeal) => {
    setEditingDealId(deal.id);
    setSubmittedSuccess(false);
    form.reset({
      title: deal.title,
      description: deal.description,
      category: deal.category,
      type: deal.type,
      discountValue: deal.discountValue,
      expiryDate: deal.expiryDate,
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!dialogOpen) {
      setSubmittedSuccess(false);
    }
  }, [dialogOpen]);

  const onSubmit = (values: DealFormValues) => {
    const payload: MerchantDeal = {
      id: editingDealId ?? `deal-${Date.now()}`,
      title: values.title,
      description: values.description,
      category: values.category,
      type: values.type,
      discountValue: values.discountValue,
      expiryDate: values.expiryDate,
      status: "pending",
      redemptions: editingDealId
        ? deals.find((deal) => deal.id === editingDealId)?.redemptions ?? 0
        : 0,
      createdAt: editingDealId
        ? deals.find((deal) => deal.id === editingDealId)?.createdAt ?? new Date().toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    };

    setDeals((current) => {
      if (editingDealId) {
        return current.map((deal) => (deal.id === editingDealId ? payload : deal));
      }

      return [payload, ...current];
    });

    setSubmittedSuccess(true);
    window.setTimeout(() => {
      setDialogOpen(false);
    }, 1200);
  };

  const toggleDealStatus = (deal: MerchantDeal) => {
    setDeals((current) =>
      current.map((item) => {
        if (item.id !== deal.id) return item;

        return {
          ...item,
          status: item.status === "paused" ? "active" : "paused",
        };
      }),
    );
  };

  const deleteDeal = (dealId: string) => {
    setDeals((current) => current.filter((deal) => deal.id !== dealId));
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff_0%,#f8fafc_46%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Deal Management</h1>
            <p className="mt-2 text-sm text-slate-600">
              Create and maintain merchant deals, vouchers, and loyalty offers from one place.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2 rounded-full px-5">
            <Plus className="h-4 w-4" />
            Create New Deal
          </Button>
        </div>

        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">Filters</CardTitle>
            <CardDescription>Search and narrow the deal list before taking action.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search deals"
                  className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                />
              </label>

              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as DealType | "all") }>
                <SelectTrigger className="h-12 rounded-2xl bg-white">
                  <Filter className="mr-2 h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="coupon">Coupon</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                  <SelectItem value="loyalty">Loyalty</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DealStatus | "all") }>
                <SelectTrigger className="h-12 rounded-2xl bg-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">All Deals</CardTitle>
            <CardDescription>Titles, status, redemption counts, and moderation actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-950">{deal.title}</p>
                        <p className="max-w-md text-sm text-slate-500">{deal.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{deal.type}</TableCell>
                    <TableCell>{statusBadge(deal.status)}</TableCell>
                    <TableCell>{deal.redemptions}</TableCell>
                    <TableCell>{formatDate(deal.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => openEditDialog(deal)}>
                          <PenLine className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => toggleDealStatus(deal)}>
                          <Pause className="h-4 w-4" />
                          {deal.status === "paused" ? "Resume" : "Pause"}
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-2 rounded-full" onClick={() => deleteDeal(deal.id)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          {submittedSuccess ? (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <DialogTitle className="text-2xl">Deal submitted for review</DialogTitle>
              <DialogDescription>
                The merchant team will review this deal before it becomes active.
              </DialogDescription>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Your changes have been saved and queued for moderation.
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <DialogHeader>
                <DialogTitle className="text-2xl tracking-tight">
                  {editingDealId ? "Edit Deal" : "Create New Deal"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details below. Submitting sends the deal to review.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...form.register("title")} placeholder="Weekend Burger Combo" />
                  <p className="text-xs text-rose-600">{form.formState.errors.title?.message}</p>
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...form.register("description")} placeholder="Describe the offer and redemption rules." />
                  <p className="text-xs text-rose-600">{form.formState.errors.description?.message}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" {...form.register("category")} placeholder="Food & Beverage" />
                  <p className="text-xs text-rose-600">{form.formState.errors.category?.message}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Deal Type</Label>
                  <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value as DealFormValues["type"], { shouldValidate: true })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coupon">Coupon</SelectItem>
                      <SelectItem value="voucher">Voucher</SelectItem>
                      <SelectItem value="loyalty">Loyalty</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-rose-600">{form.formState.errors.type?.message}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input id="discountValue" type="number" step="0.01" {...form.register("discountValue")} placeholder="49.99" />
                  <p className="text-xs text-rose-600">{form.formState.errors.discountValue?.message}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" type="date" {...form.register("expiryDate")} />
                  <p className="text-xs text-rose-600">{form.formState.errors.expiryDate?.message}</p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2 rounded-full">
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit for Review
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}