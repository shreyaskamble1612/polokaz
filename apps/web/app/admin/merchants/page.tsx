"use client";

import { useMemo, useState } from "react";
import { Search, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MerchantStatus = "active" | "pending" | "paused";

type Merchant = {
  id: string;
  name: string;
  contactEmail: string;
  deals: number;
  monthlyRevenue: number;
  status: MerchantStatus;
  tier: "merchant" | "premium";
};

const MERCHANTS: Merchant[] = [
  { id: "m1", name: "Velvet Table", contactEmail: "hello@velvettable.com", deals: 6, monthlyRevenue: 18400, status: "active", tier: "merchant" },
  { id: "m2", name: "Harbor & Honey", contactEmail: "team@harborandhoney.com", deals: 4, monthlyRevenue: 11800, status: "active", tier: "merchant" },
  { id: "m3", name: "Luma House", contactEmail: "ops@lumahouse.com", deals: 3, monthlyRevenue: 9600, status: "pending", tier: "premium" },
  { id: "m4", name: "Northline Atelier", contactEmail: "support@northline.com", deals: 5, monthlyRevenue: 15200, status: "active", tier: "merchant" },
  { id: "m5", name: "Azure Cove Hotel", contactEmail: "reservations@azurecove.com", deals: 2, monthlyRevenue: 22100, status: "paused", tier: "premium" },
  { id: "m6", name: "Glass District", contactEmail: "info@glassdistrict.com", deals: 3, monthlyRevenue: 8800, status: "active", tier: "merchant" },
  { id: "m7", name: "Neon Circuit", contactEmail: "partnerships@neoncircuit.com", deals: 4, monthlyRevenue: 13400, status: "active", tier: "merchant" },
  { id: "m8", name: "Echo Arena", contactEmail: "partners@echoarena.com", deals: 7, monthlyRevenue: 29100, status: "pending", tier: "premium" },
];

function statusBadge(status: MerchantStatus) {
  switch (status) {
    case "active":
      return <Badge className="rounded-full bg-emerald-500/14 text-emerald-700 hover:bg-emerald-500/14">Active</Badge>;
    case "pending":
      return <Badge className="rounded-full bg-amber-500/14 text-amber-700 hover:bg-amber-500/14">Pending</Badge>;
    default:
      return <Badge variant="secondary" className="rounded-full">Paused</Badge>;
  }
}

export default function Page() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MerchantStatus | "all">("all");

  const filteredMerchants = useMemo(() => {
    const normalized = search.toLowerCase();
    return MERCHANTS.filter((merchant) => {
      const matchesSearch = !normalized || merchant.name.toLowerCase().includes(normalized) || merchant.contactEmail.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || merchant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl tracking-tight">Merchant Management</CardTitle>
          <CardDescription>Monitor merchant status, deal volume, and monthly revenue.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.4fr_0.7fr]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search merchants"
              className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MerchantStatus | "all")}>
            <SelectTrigger className="h-12 rounded-2xl bg-white">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Deals</TableHead>
                <TableHead>Monthly Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMerchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell className="font-medium text-slate-950">{merchant.name}</TableCell>
                  <TableCell>{merchant.contactEmail}</TableCell>
                  <TableCell>
                    <Badge className="rounded-full bg-cyan-500/14 text-cyan-700 hover:bg-cyan-500/14">{merchant.tier}</Badge>
                  </TableCell>
                  <TableCell>{merchant.deals}</TableCell>
                  <TableCell>${merchant.monthlyRevenue.toLocaleString()}</TableCell>
                  <TableCell>{statusBadge(merchant.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-full">
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full">
                        Update
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
  );
}
