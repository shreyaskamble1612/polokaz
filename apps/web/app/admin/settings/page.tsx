"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { clientFetch } from "@/lib/api/client-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Save, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";

type ReferralTier = {
  minReferrals: number;
  maxReferrals: number | null;
  commissionPercentage: number;
};

type MilestoneBonus = {
  milestone: number;
  bonusAmount: number;
  rewardType: "cash" | "points";
};

type AdminSettings = {
  referralQualificationLimit: number;
  premiumActivationFee: string;
  vendorSetupFee: string;
  referralTiers: ReferralTier[];
  bonuses: MilestoneBonus[];
};

export default function AdminSettingsPage() {
  const { data, error, isLoading, mutate } = useSWR<any>(
    "/api/admin/settings",
    clientFetch
  );

  const [qualificationLimit, setQualificationLimit] = useState<number>(5);
  const [premiumFee, setPremiumFee] = useState<string>("25.00");
  const [vendorFee, setVendorFee] = useState<string>("80.00");
  const [tiers, setTiers] = useState<ReferralTier[]>([]);
  const [bonuses, setBonuses] = useState<MilestoneBonus[]>([]);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Sync state with fetched database settings
  useEffect(() => {
    if (data?.settings) {
      const s = data.settings as AdminSettings;
      setQualificationLimit(s.referralQualificationLimit ?? 5);
      setPremiumFee(s.premiumActivationFee ?? "25.00");
      setVendorFee(s.vendorSetupFee ?? "80.00");
      setTiers(s.referralTiers ? [...s.referralTiers] : []);
      setBonuses(s.bonuses ? [...s.bonuses] : []);
    }
  }, [data]);

  // Alert duration handler
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errMsg) {
      const timer = setTimeout(() => setErrMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errMsg]);

  const handleReset = () => {
    if (data?.settings) {
      const s = data.settings as AdminSettings;
      setQualificationLimit(s.referralQualificationLimit ?? 5);
      setPremiumFee(s.premiumActivationFee ?? "25.00");
      setVendorFee(s.vendorSetupFee ?? "80.00");
      setTiers(s.referralTiers ? [...s.referralTiers] : []);
      setBonuses(s.bonuses ? [...s.bonuses] : []);
      setSuccessMsg("Settings restored to database values.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrMsg(null);

    // Validate tiers structure
    for (const t of tiers) {
      if (t.minReferrals < 0 || t.commissionPercentage < 0 || t.commissionPercentage > 100) {
        setErrMsg("Invalid referral tier values. Percentages must be between 0 and 100.");
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        referralQualificationLimit: qualificationLimit,
        premiumActivationFee: premiumFee,
        vendorSetupFee: vendorFee,
        referralTiers: tiers,
        bonuses: bonuses,
      };

      const res = await clientFetch<{ settings: AdminSettings }>("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.settings) {
        setSuccessMsg("Platform settings successfully updated!");
        void mutate();
      } else {
        throw new Error("Invalid response received from server.");
      }
    } catch (err: any) {
      setErrMsg(err.message || "Failed to save settings. Please verify admin privileges.");
    } finally {
      setSaving(false);
    }
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? (lastTier.maxReferrals !== null ? lastTier.maxReferrals + 1 : lastTier.minReferrals + 10) : 1;
    setTiers([
      ...tiers,
      {
        minReferrals: newMin,
        maxReferrals: null,
        commissionPercentage: 10,
      },
    ]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTierField = (index: number, field: keyof ReferralTier, val: any) => {
    const updated = [...tiers];
    if (field === "maxReferrals") {
      updated[index] = {
        ...updated[index],
        maxReferrals: val === "" ? null : Number(val),
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: Number(val),
      };
    }
    setTiers(updated);
  };

  const addBonus = () => {
    const lastBonus = bonuses[bonuses.length - 1];
    const newMilestone = lastBonus ? lastBonus.milestone * 2 : 100;
    setBonuses([
      ...bonuses,
      {
        milestone: newMilestone,
        bonusAmount: 100,
        rewardType: "cash",
      },
    ]);
  };

  const removeBonus = (index: number) => {
    setBonuses(bonuses.filter((_, i) => i !== index));
  };

  const updateBonusField = (index: number, field: keyof MilestoneBonus, val: any) => {
    const updated = [...bonuses];
    if (field === "rewardType") {
      updated[index] = {
        ...updated[index],
        rewardType: val as "cash" | "points",
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: Number(val),
      };
    }
    setBonuses(updated);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          <p className="text-sm font-semibold text-slate-500">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <h2 className="text-2xl font-bold">Failed to load admin settings</h2>
        <p className="mt-2 text-sm">{error.message || "Please make sure you have administrator privileges."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
              Operational Config
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Platform Configuration Settings
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Manage qualification thresholds, subscription activation & merchant setup fees,
              residual commission tiers, and milestone referral bonuses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="h-11 rounded-2xl border-slate-200 hover:bg-slate-50 font-semibold"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Discard Changes
            </Button>
            <Button
              disabled={saving}
              onClick={handleSave}
              className="h-11 rounded-2xl bg-slate-950 text-white hover:bg-slate-800 font-semibold shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm font-semibold flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm font-semibold flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          {errMsg}
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200 h-12 inline-flex">
          <TabsTrigger value="general" className="rounded-xl px-5 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-950">
            General & Fees
          </TabsTrigger>
          <TabsTrigger value="tiers" className="rounded-xl px-5 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-950">
            Commission Tiers
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="rounded-xl px-5 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-950">
            Bonus Milestones
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General & Fees */}
        <TabsContent value="general" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Referral Qualification</CardTitle>
                <CardDescription>
                  Determine when a referring member qualifies to earn residual cash commissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qualification-limit" className="font-semibold text-slate-700">
                    Qualification Threshold (Active Referrals)
                  </Label>
                  <Input
                    id="qualification-limit"
                    type="number"
                    min={1}
                    value={qualificationLimit}
                    onChange={(e) => setQualificationLimit(Number(e.target.value))}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-slate-500 leading-normal">
                    Referrers with fewer active referrals than this limit will receive system points instead of cash commissions for any subscription transactions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">One-Time Activation & Setup Fees</CardTitle>
                <CardDescription>
                  Configure one-time fee structures dynamically billed during checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="premium-fee" className="font-semibold text-slate-700">
                    Premium Membership Activation Fee ($ USD)
                  </Label>
                  <Input
                    id="premium-fee"
                    type="text"
                    value={premiumFee}
                    onChange={(e) => setPremiumFee(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-slate-500 leading-normal">
                    One-time fee appended to the first invoice of Premium Consumer signups.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-fee" className="font-semibold text-slate-700">
                    Vendor Setup Fee ($ USD)
                  </Label>
                  <Input
                    id="vendor-fee"
                    type="text"
                    value={vendorFee}
                    onChange={(e) => setVendorFee(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-slate-500 leading-normal">
                    One-time setup fee appended to Small Vendor or Premium Vendor first checkouts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Commission Tiers */}
        <TabsContent value="tiers" className="mt-4">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Residual Commission Schedule</CardTitle>
                <CardDescription>
                  Dynamic commission percentage mapping determined by the referrer's active referral count.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addTier}
                className="h-9 rounded-xl border-slate-200 font-semibold"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Bracket
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Referrals</TableHead>
                    <TableHead>Max Referrals</TableHead>
                    <TableHead>Commission Percentage (%)</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={tier.minReferrals}
                          onChange={(e) => updateTierField(index, "minReferrals", e.target.value)}
                          className="h-10 w-28 rounded-lg"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          value={tier.maxReferrals !== null ? tier.maxReferrals : ""}
                          onChange={(e) => updateTierField(index, "maxReferrals", e.target.value)}
                          className="h-10 w-28 rounded-lg"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={tier.commissionPercentage}
                            onChange={(e) => updateTierField(index, "commissionPercentage", e.target.value)}
                            className="h-10 w-24 rounded-lg"
                          />
                          <span className="text-slate-500 font-semibold">%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTier(index)}
                          className="h-9 w-9 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tiers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                        No commission brackets configured. Click "Add Bracket" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Bonus Milestones */}
        <TabsContent value="bonuses" className="mt-4">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Milestone Referral Bonuses</CardTitle>
                <CardDescription>
                  Configure payouts or points rewards unlocked when referrers hit referral milestone totals.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addBonus}
                className="h-9 rounded-xl border-slate-200 font-semibold"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Milestone
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone Referral Count</TableHead>
                    <TableHead>Reward Value</TableHead>
                    <TableHead>Reward Type</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonuses.map((bonus, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={bonus.milestone}
                          onChange={(e) => updateBonusField(index, "milestone", e.target.value)}
                          className="h-10 w-28 rounded-lg"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={bonus.bonusAmount}
                          onChange={(e) => updateBonusField(index, "bonusAmount", e.target.value)}
                          className="h-10 w-28 rounded-lg"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={bonus.rewardType}
                          onValueChange={(val) => updateBonusField(index, "rewardType", val)}
                        >
                          <SelectTrigger className="h-10 w-28 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash ($ USD)</SelectItem>
                            <SelectItem value="points">System Points</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBonus(index)}
                          className="h-9 w-9 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {bonuses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                        No milestone bonuses configured. Click "Add Milestone" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
