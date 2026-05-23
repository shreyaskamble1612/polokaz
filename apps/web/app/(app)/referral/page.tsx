"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CreateReferralDialog } from "@/components/create-referral-dialog";
import { Copy, Check, Link2, Plus } from "lucide-react";

interface Referral {
  id: string;
  trackdeskUrl: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  createdAt: string;
}

function getReferralUrl(ref: Referral) {
  if (ref.trackdeskUrl) return ref.trackdeskUrl;
  return `${process.env.NEXT_PUBLIC_APP_URL}/sign-up/onboarding?referralId=${ref.id}`;
}

function getStatus(ref: Referral): "active" | "expired" {
  if (ref.expiresAt && new Date(ref.expiresAt) < new Date()) return "expired";
  return "active";
}

export default function ReferralPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchReferrals = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/referral`,
        { credentials: "include" },
      );
      const data = await res.json();
      setReferrals(data.referrals ?? []);
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const copyUrl = (ref: Referral) => {
    navigator.clipboard.writeText(getReferralUrl(ref));
    setCopiedId(ref.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreated = (newReferral: Referral) => {
    setReferrals((prev) => [newReferral, ...prev]);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter">
            Referral Links
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Share a link to invite friends. Trackdesk click tracking is applied
            automatically.
          </p>
        </div>
        <CreateReferralDialog onSuccess={handleCreated}>
          <Button size="sm" className="gap-2 shrink-0">
            <Plus className="size-4" />
            New link
          </Button>
        </CreateReferralDialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Link2 className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No referral links yet. Create one to start inviting friends.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((ref) => {
            const status = getStatus(ref);
            const url = getReferralUrl(ref);
            return (
              <Card key={ref.id} className="p-5 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {ref.id.slice(0, 8)}…
                  </span>
                  <Badge
                    variant={status === "active" ? "success" : "destructive"}
                  >
                    {status}
                  </Badge>
                  {ref.trackdeskUrl && (
                    <Badge variant="secondary">Trackdesk</Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {ref.expiresAt
                      ? `Expires ${new Date(ref.expiresAt).toLocaleDateString()}`
                      : "Never expires"}
                    {ref.maxUses ? ` · max ${ref.maxUses} uses` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={url}
                    className="font-mono text-xs h-9"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0"
                    onClick={() => copyUrl(ref)}
                    title="Copy link"
                  >
                    {copiedId === ref.id ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
