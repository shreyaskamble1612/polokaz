"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

const REFERRAL_LINK = "https://polokaz.com/join?ref=ABC123XYZ";

const REFERRAL_STATS = {
  joined: 9,
  active: 6,
  points: 450,
};

export function ReferralCard() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(REFERRAL_LINK);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const encodedLink = encodeURIComponent(REFERRAL_LINK);
  const encodedText = encodeURIComponent(
    `Join me on Polokaz and unlock exclusive deals: ${REFERRAL_LINK}`
  );

  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}`,
      icon: MessageCircle,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent("Join me on Polokaz")}&body=${encodedText}`,
      icon: Mail,
    },
    {
      label: "Twitter/X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`,
      icon: Share2,
    },
  ];

  return (
    <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(24,24,31,0.96)_0%,rgba(12,12,18,0.98)_100%)] py-0 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <CardContent className="space-y-6 px-6 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
            Referral Share
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Invite friends and grow your rewards.
          </h2>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Your referral link
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200">
              {REFERRAL_LINK}
            </div>
            <Button
              type="button"
              onClick={copyToClipboard}
              className="rounded-2xl bg-white text-zinc-950 hover:bg-cyan-100"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {shareLinks.map((item) => (
            <Button
              key={item.label}
              asChild
              variant="outline"
              className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <a href={item.href} target="_blank" rel="noreferrer">
                <item.icon className="size-4" />
                {item.label}
              </a>
            </Button>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <p className="text-sm leading-7 text-zinc-300">
            <span className="font-semibold text-white">
              {REFERRAL_STATS.joined} friends joined
            </span>{" "}
            &middot;{" "}
            <span className="font-semibold text-white">
              {REFERRAL_STATS.active} active
            </span>{" "}
            &middot;{" "}
            <span className="font-semibold text-white">
              {REFERRAL_STATS.points} points earned from referrals
            </span>
          </p>
        </div>

        <Badge className="w-fit border-amber-300/20 bg-amber-500/14 text-amber-100">
          Refer 3 more friends to unlock Gold tier benefits.
        </Badge>
      </CardContent>
    </Card>
  );
}
