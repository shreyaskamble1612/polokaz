"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Copy, Check, AlertTriangle } from "lucide-react";

const availableDates = [
  {
    name: "30 minutes",
    value: 60 * 30, // 30 min
  },
  {
    name: "1 hour",
    value: 60 * 60, // 1 hour
  },
  {
    name: "6 hours",
    value: 60 * 60 * 6, // 6 hours
  },
  {
    name: "12 hours",
    value: 60 * 60 * 12, // 12 hours
  },
  {
    name: "7 days",
    value: 60 * 60 * 24 * 7, // 7 days
  },
  {
    name: "Never",
    value: 60 * 60 * 24 * 365 * 100, // 100 years
  },
];

interface CreateReferralDialogProps {
  children: React.ReactNode;
  onSuccess?: (referral: any) => void;
}

export function CreateReferralDialog({ children, onSuccess }: CreateReferralDialogProps) {
  const [expiresAt, setExpiresAt] = useState(
    availableDates[0].value.toString(),
  );
  const [maxUses, setMaxUses] = useState("1");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdReferralCode, setCreatedReferralCode] = useState("");
  const [createdReferralData, setCreatedReferralData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/referral`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            expiresAt: parseInt(expiresAt) * 1000,
            maxUses: parseInt(maxUses),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create referral");
      }

      console.log(data.referral.id);
      setCreatedReferralCode(data.referral.id);
      setCreatedReferralData(data.referral); // Store full referral object
      setOpen(false);
      setSuccessOpen(true);
      onSuccess?.(data.referral);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = () => {
    // Use Trackdesk URL if available, otherwise use direct link
    if (createdReferralData?.trackdeskUrl) {
      return createdReferralData.trackdeskUrl;
    }
    return `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?referralId=${createdReferralCode}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getReferralUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogTitle className="tracking-tighter text-xl">
            Invite friends
          </DialogTitle>

          <div className="my-2 space-y-6">
            <Field>
              <FieldLabel>Expires at</FieldLabel>
              <Select
                value={expiresAt}
                onValueChange={setExpiresAt}
                defaultValue={availableDates[0].value.toString()}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date, index) => (
                    <SelectItem key={index} value={date.value?.toString()}>
                      {date.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Max uses</FieldLabel>
              <Select
                value={maxUses}
                onValueChange={setMaxUses}
                defaultValue="1"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 use</SelectItem>
                  <SelectItem value="5">5 uses</SelectItem>
                  <SelectItem value="10">10 uses</SelectItem>
                  <SelectItem value="25">25 uses</SelectItem>
                  <SelectItem value="50">50 uses</SelectItem>
                  <SelectItem value="100">100 uses</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {error && (
              <div className="bg-destructive/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="text-destructive size-4" />
                <span className="text-destructive tracking-tighter text-sm">
                  {error}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="flex-1" variant="secondary">
                Cancel
              </Button>
            </DialogClose>

            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? <Spinner /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tracking-tighter text-xl">
              Link created
            </DialogTitle>
            <DialogDescription>
              Invite a your friends with the following link
            </DialogDescription>
          </DialogHeader>

          <Field>
            <div className="flex items-center space-x-2 my-4">
              <div className="grid flex-1 gap-2">
                <Input
                  readOnly
                  disabled
                  value={getReferralUrl()}
                  className="font-mono"
                />
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="w-full">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
