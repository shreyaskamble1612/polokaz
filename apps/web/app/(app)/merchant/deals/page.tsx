"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Filter, Loader2, Plus, Search } from "lucide-react";

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
import { createMerchantDeal, fetchMerchantDeals, type MerchantDeal, type MerchantProfile } from "@/lib/api/merchants";

const dealSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Add a short description"),
  category: z.string().min(1, "Choose a category"),
  dealType: z.enum(["coupon", "voucher", "loyalty"]),
  discountValue: z.coerce.number().positive("Enter a discount value"),
  expiryDate: z.string().min(1, "Choose an expiry date"),
});

type DealFormValues = z.infer<typeof dealSchema>;
type DealFormInput = z.input<typeof dealSchema>;

function formatDate(value: string | null) {
  if (!value) return "No expiry";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadge(status: MerchantDeal["status"]) {
  switch (status) {
    case "active":
      return <Badge className="rounded-full bg-emerald-500/14 text-emerald-700 hover:bg-emerald-500/14">Active</Badge>;
    case "pending_moderation":
      return <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Pending review</Badge>;
    case "rejected":
      return <Badge className="rounded-full bg-rose-500/14 text-rose-700 hover:bg-rose-500/14">Rejected</Badge>;
    default:
      return <Badge variant="secondary" className="rounded-full">Inactive</Badge>;
  }
}

function typeBadge(type: MerchantDeal["dealType"]) {
  const label = type === "coupon" ? "Coupon" : type === "voucher" ? "Voucher" : "Loyalty";
  const className =
    type === "coupon"
      ? "bg-cyan-500/14 text-cyan-700"
      : type === "voucher"
        ? "bg-violet-500/14 text-violet-700"
        : "bg-amber-500/14 text-amber-700";

  return <Badge className={`rounded-full hover:bg-transparent ${className}`}>{label}</Badge>;
}

export default function Page() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [deals, setDeals] = useState<MerchantDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MerchantDeal["dealType"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MerchantDeal["status"] | "all">("all");

  const form = useForm<DealFormInput, unknown, DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      dealType: "coupon",
      discountValue: 0,
      expiryDate: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadDeals() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetchMerchantDeals();

        if (!isMounted) return;

        setMerchant(response.merchant);
        setDeals(response.deals);
      } catch (error) {
        if (!isMounted) return;

        setLoadError(error instanceof Error ? error.message : "Unable to load merchant deals");
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

  const filteredDeals = useMemo(() => {
    const normalized = search.toLowerCase();

    return deals.filter((deal) => {
      const matchesSearch =
        !normalized ||
        deal.title.toLowerCase().includes(normalized) ||
        deal.description?.toLowerCase().includes(normalized) ||
        deal.category.toLowerCase().includes(normalized) ||
        deal.rejectionReason?.toLowerCase().includes(normalized);
      const matchesType = typeFilter === "all" || deal.dealType === typeFilter;
      const matchesStatus = statusFilter === "all" || deal.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [deals, search, typeFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      total: deals.length,
      active: deals.filter((deal) => deal.status === "active").length,
      review: deals.filter((deal) => deal.status === "pending_moderation").length,
      rejected: deals.filter((deal) => deal.status === "rejected").length,
    }),
    [deals],
  );

  const openCreateDialog = () => {
    setSubmitError(null);
    setSuccessMessage(null);
    form.reset({
      title: "",
      description: "",
      category: "",
      dealType: "coupon",
      discountValue: 0,
      expiryDate: "",
    });
    setDialogOpen(true);
  };

  const submitDeal = async (values: DealFormValues) => {
    setSubmitError(null);

    try {
      const response = await createMerchantDeal({
        title: values.title,
        description: values.description,
        category: values.category,
        dealType: values.dealType,
        discountValue: String(values.discountValue),
        expiresAt: new Date(`${values.expiryDate}T00:00:00.000Z`).toISOString(),
      });

      setDeals((current) => [response.deal, ...current]);
      setSuccessMessage(response.message);
      setDialogOpen(false);
      form.reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit deal");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff_0%,#f8fafc_46%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="inline-flex rounded-full bg-cyan-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Merchant deals
              </p>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950">
                  {merchant ? `${merchant.businessName} deals` : "Deal management"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                  Create a new deal, review moderation status, and keep track of what is live for your merchant account.
                </p>
              </div>
            </div>

            <Button onClick={openCreateDialog} className="gap-2 rounded-full px-5">
              <Plus className="h-4 w-4" />
              Create New Deal
            </Button>
          </div>
        </section>

        {loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {loadError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total deals", value: counts.total.toString(), accent: "from-sky-500 to-cyan-400" },
            { label: "Active deals", value: counts.active.toString(), accent: "from-emerald-500 to-emerald-400" },
            { label: "Pending review", value: counts.review.toString(), accent: "from-amber-500 to-orange-400" },
            { label: "Rejected", value: counts.rejected.toString(), accent: "from-rose-500 to-pink-400" },
          ].map((item) => (
            <Card key={item.label} className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl tracking-tight text-slate-950">{item.value}</CardTitle>
                </div>
                <div className={`h-11 w-11 rounded-2xl bg-linear-to-br ${item.accent}`} />
              </CardHeader>
            </Card>
          ))}
        </section>

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

              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as MerchantDeal["dealType"] | "all")}>
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

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MerchantDeal["status"] | "all")}>
                <SelectTrigger className="h-12 rounded-2xl bg-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_moderation">Pending review</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">All Deals</CardTitle>
            <CardDescription>Titles, status, moderation notes, and redemption counts from the live API.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading merchant deals...
              </div>
            ) : filteredDeals.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-950">{deal.title}</p>
                          <p className="max-w-md text-sm text-slate-500">{deal.description ?? "No description provided"}</p>
                          {deal.rejectionReason ? (
                            <p className="text-xs text-rose-700">Rejected: {deal.rejectionReason}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{typeBadge(deal.dealType)}</TableCell>
                      <TableCell>{statusBadge(deal.status)}</TableCell>
                      <TableCell>{deal.redemptionCount}</TableCell>
                      <TableCell>{formatDate(deal.expiresAt)}</TableCell>
                      <TableCell>{formatDate(deal.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : deals.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="mt-3 text-sm font-semibold text-slate-950">No deals created yet.</p>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Create your first deal to get started.
                </p>
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="mt-3 text-sm font-semibold text-slate-950">No deals matched your filters</p>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Clear the filters to see your full merchant catalog.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={form.handleSubmit(submitDeal)} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl tracking-tight">Create New Deal</DialogTitle>
              <DialogDescription>
                The deal will be created in Coupontools and queued for moderation before it becomes active.
              </DialogDescription>
            </DialogHeader>

            {submitError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {submitError}
              </div>
            ) : null}

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
                <Label htmlFor="dealType">Deal Type</Label>
                <Select value={form.watch("dealType")} onValueChange={(value) => form.setValue("dealType", value as DealFormValues["dealType"], { shouldValidate: true })}>
                  <SelectTrigger id="dealType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coupon">Coupon</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="loyalty">Loyalty</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-rose-600">{form.formState.errors.dealType?.message}</p>
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
              <Button type="submit" className="gap-2 rounded-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit for Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
