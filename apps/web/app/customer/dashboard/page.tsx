"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@polokaz/auth/client";
import { type Deal } from "@/lib/api/deals";
import { clientFetch } from "@/lib/api/client-fetch";
import {
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { formatCategoryName } from "@/lib/utils";

type UserProfile = {
  name: string;
  email: string;
  image?: string | null;
};

const CATEGORY_OPTIONS = [
  { label: "Select Category", value: "all" },
  { label: "Food & Shopping", value: "food" },
  { label: "Health & Wellness", value: "health" },
  { label: "Beauty & Fitness", value: "beauty" },
  { label: "Retail & Travel", value: "retail" },
];

const LOCATION_OPTIONS = [
  "Select location",
  "Las Vegas, Nevada",
  "New York, USA",
  "Chicago, USA",
  "Los Angeles, USA",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function mapDealCategory(category: string | null) {
  return formatCategoryName(category);
}

const CATEGORIES_THEMES = [
  {
    id: "food",
    title: "Food & Drink",
    color: "bg-[#0f7af7]",
    borderColor: "border-[#bedcff]",
    buttonColor: "bg-[#0f7af7] hover:bg-[#0b66d1]"
  },
  {
    id: "health",
    title: "Wellness",
    color: "bg-[#ef8a23]",
    borderColor: "border-[#ffd9ba]",
    buttonColor: "bg-[#ef8a23] hover:bg-[#d97712]"
  },
  {
    id: "beauty",
    title: "Beauty & Personal Care",
    color: "bg-[#10b981]",
    borderColor: "border-[#a7f3d0]",
    buttonColor: "bg-[#10b981] hover:bg-[#059669]"
  },
  {
    id: "retail",
    title: "Retail & Shopping",
    color: "bg-[#8b5cf6]",
    borderColor: "border-[#ddd6fe]",
    buttonColor: "bg-[#8b5cf6] hover:bg-[#7c3aed]"
  },
  {
    id: "education",
    title: "Education",
    color: "bg-[#ec4899]",
    borderColor: "border-[#fbcfe8]",
    buttonColor: "bg-[#ec4899] hover:bg-[#db2777]"
  }
];

const FALLBACK_THEME = {
  id: "general",
  title: "General",
  color: "bg-[#64748b]",
  borderColor: "border-[#e2e8f0]",
  buttonColor: "bg-[#64748b] hover:bg-[#475569]"
};

function getCategoryTheme(category: string | null) {
  if (!category) return FALLBACK_THEME;
  const normalized = category.trim().toLowerCase();

  if (normalized.includes("food") || normalized.includes("dining") || normalized.includes("restaurant") || normalized.includes("drink")) {
    return CATEGORIES_THEMES.find(c => c.id === "food") || FALLBACK_THEME;
  }
  if (normalized.includes("health") || normalized.includes("wellness") || normalized.includes("spa") || normalized.includes("fitness")) {
    return CATEGORIES_THEMES.find(c => c.id === "health") || FALLBACK_THEME;
  }
  if (normalized.includes("beauty") || normalized.includes("personal care") || normalized.includes("salon")) {
    return CATEGORIES_THEMES.find(c => c.id === "beauty") || FALLBACK_THEME;
  }
  if (normalized.includes("retail") || normalized.includes("shop") || normalized.includes("store") || normalized.includes("boutique")) {
    return CATEGORIES_THEMES.find(c => c.id === "retail") || FALLBACK_THEME;
  }
  if (normalized.includes("education") || normalized.includes("class") || normalized.includes("learn")) {
    return CATEGORIES_THEMES.find(c => c.id === "education") || FALLBACK_THEME;
  }

  const matched = CATEGORIES_THEMES.find(c => c.id === normalized);
  return matched || FALLBACK_THEME;
}

function matchesCategoryHelper(dealCategory: string | null, selected: string | null): boolean {
  if (!selected || selected === "all") return true;
  if (!dealCategory) return false;

  const dealLower = dealCategory.toLowerCase();
  const selectedLower = selected.toLowerCase();

  if (selectedLower === "food") {
    return dealLower.includes("food") || dealLower.includes("dining") || dealLower.includes("restaurant") || dealLower.includes("drink") || dealLower.includes("beverage");
  }
  if (selectedLower === "health") {
    return dealLower.includes("health") || dealLower.includes("wellness") || dealLower.includes("spa") || dealLower.includes("fitness") || dealLower.includes("gym") || dealLower.includes("yoga");
  }
  if (selectedLower === "beauty") {
    return dealLower.includes("beauty") || dealLower.includes("salon") || dealLower.includes("hair") || dealLower.includes("personal care") || dealLower.includes("cosmetics");
  }
  if (selectedLower === "retail") {
    return dealLower.includes("retail") || dealLower.includes("shopping") || dealLower.includes("shop") || dealLower.includes("store") || dealLower.includes("boutique") || dealLower.includes("goods") || dealLower.includes("hotels") || dealLower.includes("trips") || dealLower.includes("travel");
  }
  if (selectedLower === "education") {
    return dealLower.includes("education") || dealLower.includes("class") || dealLower.includes("learn") || dealLower.includes("school");
  }

  return dealLower === selectedLower || dealLower.includes(selectedLower);
}


export default function Page() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("Select location");
  const [activeTab, setActiveTab] = useState<"coupons" | "vouchers">("coupons");
  const [visibleCount, setVisibleCount] = useState(6);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [user, setUser] = useState<UserProfile>({
    name: "My Account",
    email: "account@polokaz.com",
    image: null,
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [merchantsList, setMerchantsList] = useState<any[]>([]);


  const [points, setPoints] = useState<number>(0);
  const [walletStats, setWalletStats] = useState({ savedCount: 0, redeemedCount: 0 });
  const [affiliateStats, setAffiliateStats] = useState({ totalEarned: 0, pending: 0 });
  const [referralStats, setReferralStats] = useState({ clicks: 0, conversions: 0, pointsEarned: 0 });
  const [userTier, setUserTier] = useState<string>("free");

  useEffect(() => {
    router.prefetch("/customer/dashboard");
    router.prefetch("/customer/coupons");
  }, [router]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const sessionRes = await authClient.getSession();
        if (sessionRes.data?.user) {
          setUser({
            name: sessionRes.data.user.name,
            email: sessionRes.data.user.email,
            image: sessionRes.data.user.image,
          });
          const tier = (sessionRes.data.user as any).tier || "free";
          setUserTier(tier);

          // Fetch points
          const pointsRes = await clientFetch<{ balance: number }>("/api/me/points").catch(() => ({ balance: 0 }));
          setPoints(pointsRes.balance);

          // Fetch wallet stats
          const walletRes = await clientFetch<{ savedCount: number; redeemedCount: number }>("/api/wallet").catch(() => ({ savedCount: 0, redeemedCount: 0 }));
          setWalletStats({
            savedCount: walletRes.savedCount,
            redeemedCount: walletRes.redeemedCount,
          });

          // Fetch affiliate stats if gold or premium
          if (tier === "gold" || tier === "premium") {
            const affiliateRes = await clientFetch<{ totalEarned: number; pending: number }>("/api/me/affiliate-stats").catch(() => ({ totalEarned: 0, pending: 0 }));
            setAffiliateStats({
              totalEarned: affiliateRes.totalEarned,
              pending: affiliateRes.pending,
            });
          }

          // Fetch referral stats
          const referralRes = await clientFetch<{ stats: { clicks: number; conversions: number; pointsEarned: number } }>("/api/referral/my-link").catch(() => null);
          if (referralRes?.stats) {
            setReferralStats(referralRes.stats);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }

    async function loadDeals() {
      try {
        const data = await clientFetch<{ deals: Deal[] }>("/api/deals?limit=20");
        if (Array.isArray(data.deals)) {
          setDeals(data.deals);
        }
      } catch (err) {
        console.error("Failed to fetch deals", err);
        setDeals([]);
      }
    }

    async function loadMerchants() {
      try {
        const data = await clientFetch<{ merchants: any[] }>("/api/merchants");
        if (Array.isArray(data.merchants)) {
          setMerchantsList(data.merchants);
        }
      } catch (err) {
        console.error("Failed to fetch merchants", err);
      }
    }

    loadDashboardData();
    loadDeals();
    loadMerchants();
  }, []);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab, searchQuery, selectedCategory, selectedLocation]);

  async function handleSaveDeal(dealId: string) {
    try {
      await clientFetch("/api/wallet/save", {
        method: "POST",
        body: JSON.stringify({ dealId }),
      });
      // Refresh wallet stats
      const walletRes = await clientFetch<{ savedCount: number; redeemedCount: number }>("/api/wallet").catch(() => ({ savedCount: 0, redeemedCount: 0 }));
      setWalletStats({
        savedCount: walletRes.savedCount,
        redeemedCount: walletRes.redeemedCount,
      });
      alert("Deal saved to your wallet successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save deal");
    }
  }

  const couponRows = useMemo(() => {
    return deals.filter((deal) => {
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        deal.title.toLowerCase().includes(normalizedSearch) ||
        deal.merchantName.toLowerCase().includes(normalizedSearch) ||
        deal.description?.toLowerCase().includes(normalizedSearch);

      const matchesCategory = matchesCategoryHelper(deal.category, selectedCategory);

      const merchantObj = merchantsList.find((m) => m.id === deal.merchantId);
      const mAddress = deal.merchantLocation || merchantObj?.companyAddress || "Las Vegas, Nevada";
      const matchesLocation =
        selectedLocation === "Select location" ||
        mAddress.toLowerCase().includes(selectedLocation.split(",")[0].toLowerCase());

      return matchesSearch && matchesCategory && matchesLocation && deal.dealType === "coupon";
    });
  }, [deals, searchQuery, selectedCategory, selectedLocation, merchantsList]);

  const voucherRows = useMemo(() => {
    return deals.filter((deal) => {
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        deal.title.toLowerCase().includes(normalizedSearch) ||
        deal.merchantName.toLowerCase().includes(normalizedSearch) ||
        deal.description?.toLowerCase().includes(normalizedSearch);

      const matchesCategory = matchesCategoryHelper(deal.category, selectedCategory);

      const merchantObj = merchantsList.find((m) => m.id === deal.merchantId);
      const mAddress = deal.merchantLocation || merchantObj?.companyAddress || "Las Vegas, Nevada";
      const matchesLocation =
        selectedLocation === "Select location" ||
        mAddress.toLowerCase().includes(selectedLocation.split(",")[0].toLowerCase());

      return matchesSearch && matchesCategory && matchesLocation && (deal.dealType === "voucher" || deal.dealType === "loyalty");
    });
  }, [deals, searchQuery, selectedCategory, selectedLocation, merchantsList]);

  const rows = activeTab === "coupons" ? couponRows : voucherRows;
  const visibleRows = rows.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-[#eef2f7] text-[#15253b]">
      <header className="sticky top-0 z-30 border-b border-[#dfe7f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center">
            <BrandLogo href="/customer" size="md" />
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <nav className="relative z-10 flex items-center gap-2 text-sm font-medium text-[#4b5c74]">
              <Link href="/customer" prefetch className="rounded-full px-4 py-2 transition hover:text-[#0f7af7]">
                Home
              </Link>
              <Link
                href="/customer/coupons"
                prefetch
                className="rounded-full px-4 py-2 transition hover:text-[#0f7af7]"
              >
                Coupons
              </Link>
              <Link
                href="/customer/dashboard"
                prefetch
                className="rounded-full px-4 py-2 text-[#0f7af7] bg-[#eef3fb] font-semibold"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="hidden flex-1 justify-end md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative z-10 flex items-center gap-3 rounded-full bg-[#eef3fb] px-3 py-2 text-left transition hover:bg-[#e5edf8]"
                >
                  <Avatar className="h-10 w-10 border border-[#d8e4f6]">
                    <AvatarImage src={user.image ?? ""} alt={user.name} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[150px] truncate text-[15px] font-medium text-[#2f4460]">
                    {user.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#7d8da3]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-64 rounded-2xl border-[#dfe8f5] p-2 shadow-[0_20px_50px_rgba(25,42,70,0.12)]"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#d8e4f6]">
                      <AvatarImage src={user.image ?? ""} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#22334d]">
                        {user.name}
                      </p>
                      <p className="truncate text-xs font-normal text-[#7d8ea5]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#e8eef7]" />
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer">
                  <Link href="/customer/dashboard" prefetch>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer">
                  <Link href="/wallet" prefetch>My Wallet</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer">
                  <Link href="/customer/coupons" prefetch>Explore Coupons</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer">
                  <Link href="/referral" prefetch>Referral Program</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#e8eef7]" />
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-red-600">
                  <LogoutButton
                    className="flex w-full items-center gap-2 text-left"
                    label="Log out"
                    onLogout={() => router.refresh()}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e4f6] text-[#24405f] md:hidden"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileNavOpen ? (
          <div className="border-t border-[#e4ebf5] bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium text-[#4b5c74]">
              <Link href="/customer" prefetch className="rounded-xl px-3 py-2">
                Home
              </Link>
              <Link href="/customer/coupons" prefetch className="rounded-xl px-3 py-2">
                Coupons
              </Link>
              <Link href="/customer/dashboard" prefetch className="rounded-xl px-3 py-2 text-[#0f7af7] bg-[#eef3fb] font-semibold">
                Dashboard
              </Link>
              <a href="#" className="rounded-xl px-3 py-2">
                Events
              </a>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#eef3fb] px-3 py-3">
              <Avatar className="h-10 w-10 border border-[#d8e4f6]">
                <AvatarImage src={user.image ?? ""} alt={user.name} />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#22334d]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[#7d8ea5]">{user.email}</p>
              </div>
            </div>
            <LogoutButton
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8e4f6] bg-white px-4 py-3 text-sm font-medium text-[#24405f] transition hover:bg-[#f7faff]"
              label="Log out"
              onLogout={() => router.refresh()}
            />
          </div>
        ) : null}
      </header>

      <section className="bg-[linear-gradient(90deg,#0c3f73_0%,#0b4d8d_40%,#173a63_100%)] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm text-white/80">Welcome back,</p>
            <h1 className="mt-1 text-3xl font-black italic sm:text-4xl">
              {user.name}
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Here&apos;s what&apos;s happening with your deals today
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Saved Deals", value: String(walletStats.savedCount) },
              { label: "Redeemed Deals", value: String(walletStats.redeemedCount) },
              {
                label: userTier === "gold" || userTier === "premium" ? "My Earnings" : "My Points",
                value: userTier === "gold" || userTier === "premium"
                  ? `$${(affiliateStats.totalEarned + affiliateStats.pending).toFixed(2)}`
                  : `${points} pts`,
              },
              { label: "Friends Joined", value: String(referralStats.conversions), accent: true },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-[150px] rounded-2xl border border-white/18 bg-white/8 px-6 py-5 text-center backdrop-blur"
              >
                <p
                  className={`text-3xl font-black italic ${item.accent ? "text-[#ff9a2f]" : "text-white"
                    }`}
                >
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-white/70">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_rgba(20,42,79,0.08)]">
          <div className="border-b border-[#edf1f6] px-4 pt-5 sm:px-6">
            <div className="flex gap-8 text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("coupons")}
                className={`border-b-2 pb-4 transition ${activeTab === "coupons"
                  ? "border-[#0f7af7] text-[#0f7af7]"
                  : "border-transparent text-[#1e2f46]"
                  }`}
              >
                Available Coupons
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vouchers")}
                className={`border-b-2 pb-4 transition ${activeTab === "vouchers"
                  ? "border-[#0f7af7] text-[#0f7af7]"
                  : "border-transparent text-[#1e2f46]"
                  }`}
              >
                Available Vouchers
              </button>
            </div>
          </div>

          <div className="bg-[#f5f7fb] px-4 py-5 sm:px-6">
            <div className="grid gap-3 rounded-[22px] bg-white p-3 shadow-[0_10px_30px_rgba(20,42,79,0.06)] lg:grid-cols-[1.3fr_1fr_1fr_auto]">
              <label className="flex items-center gap-3 rounded-2xl border border-[#e8edf5] px-4 py-3">
                <Search className="h-4 w-4 text-[#91a1b5]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search here"
                  className="w-full bg-transparent text-sm text-[#22344e] outline-none placeholder:text-[#9dadc0]"
                />
              </label>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                aria-label="Filter by category"
                className="rounded-2xl border border-[#e8edf5] px-4 py-3 text-sm text-[#6f8197] outline-none"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                aria-label="Filter by location"
                className="rounded-2xl border border-[#e8edf5] px-4 py-3 text-sm text-[#6f8197] outline-none"
              >
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="rounded-2xl bg-[#0f7af7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b66d1]"
              >
                Search
              </button>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {visibleRows.map((row) => {
                const theme = getCategoryTheme(row.category);
                const merchantObj = merchantsList.find((m) => m.id === row.merchantId);
                const mAddress = row.merchantLocation || merchantObj?.companyAddress || "Las Vegas, Nevada";

                return (
                  <article
                    key={row.id}
                    className={`overflow-hidden rounded-[20px] border bg-white shadow-[0_12px_34px_rgba(18,40,74,0.08)] ${theme.borderColor}`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative h-52 overflow-hidden sm:h-auto sm:w-[34%]">
                        <Image
                          src={
                            row.thumbnailUrl ||
                            row.images?.[0] ||
                            "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80"
                          }
                          alt={row.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 34vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[#0f1c2d]/18" />
                        <div
                          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold text-white ${theme.color}`}
                        >
                          {mapDealCategory(row.category)}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4 sm:p-5 justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-bold leading-tight text-[#1d2b40]">
                                {row.title}
                              </h3>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                ACTIVE
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold text-white ${theme.color}`}
                            >
                              {row.merchantName}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-[#6e8097]">
                            {row.description ||
                              "Enjoy premium local offers with flexible savings on every order."}
                          </p>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                            <div className="rounded-2xl bg-[#f8fbff] p-3">
                              <p className="font-medium text-[#97a6ba]">Live Date</p>
                              <p className="mt-1 font-semibold text-[#23354f]">
                                {formatDate(row.startDate)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-[#f8fbff] p-3">
                              <p className="font-medium text-[#97a6ba]">End Date</p>
                              <p className="mt-1 font-semibold text-[#23354f]">
                                {formatDate(row.endDate)}
                              </p>
                            </div>
                            <div className="col-span-2 rounded-2xl bg-[#f8fbff] p-3 sm:col-span-1">
                              <p className="font-medium text-[#97a6ba]">Location</p>
                              <p className="mt-1 font-semibold text-[#23354f] truncate" title={mAddress}>
                                {mAddress}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-end">
                          <Link
                            href={`/deals/${row.id}`}
                            className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${theme.buttonColor}`}
                          >
                            Get Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {visibleRows.length === 0 ? (
              <div className="mt-6 rounded-[20px] border border-dashed border-[#ccdaea] bg-white px-6 py-12 text-center text-sm text-[#6e8097]">
                No results matched your current filters.
              </div>
            ) : null}

            {visibleCount < rows.length ? (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + 4)}
                  className="flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-semibold text-[#0f7af7] shadow-[inset_0_0_0_1px_#dce8f8]"
                >
                  Load More
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="bg-[#071425] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.7fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3">
                <BrandLogo size="lg" />
              </div>
              <p className="mt-2 text-xs text-white/60">Save more, locally.</p>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/68">
                We connect users with the best nearby restaurants, cafes,
                stores, and service providers to help you save more while
                enjoying your favorite experiences.
              </p>

              <div className="mt-6 flex items-center gap-3">
                {[Facebook, X, Instagram, Mail].map((Icon, index) => (
                  <div
                    key={index}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5"
                  >
                    <Icon className="h-4 w-4 text-[#85c2ff]" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#4da4ff]">
                Important Links
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-white/70">
                <li>Coupons</li>
                <li>Events</li>
                <li>About us</li>
                <li>Career</li>
                <li>Subscription</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#4da4ff]">
                Contact Us
              </h3>
              <div className="mt-5 space-y-4 text-sm text-white/70">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#85c2ff]" />
                  <p>ABC Company, 123 East 7th Street, St. Louis 10001</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[#85c2ff]" />
                  <p>(123) 456-7890</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#85c2ff]" />
                  <p>polokaz@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>(c) 2026 ABC Company. All Rights Reserved.</p>
            <div className="flex items-center gap-5">
              <button type="button">Help Center</button>
              <button type="button">Privacy Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
