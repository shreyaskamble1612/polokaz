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
import { getDummyDeals, type Deal } from "@/lib/api/deals";
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
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";

type UserProfile = {
  name: string;
  email: string;
  image?: string | null;
};

type DashboardTab = "coupons" | "vouchers";

type CategoryItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

type VoucherRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  code: string;
  merchant: string;
  liveDate: string;
  endDate: string;
  location: string;
  image: string;
};

type DashboardCard = {
  id: string;
  title: string;
  description: string;
  categoryLabel: string;
  code: string;
  merchant: string;
  liveDate: string;
  endDate: string;
  location: string;
  imageSrc: string;
};

const CATEGORY_OPTIONS = [
  { label: "Select Category", value: "all" },
  { label: "Food & Drinks", value: "food" },
  { label: "Wellness", value: "health" },
  { label: "Beauty & Fitness", value: "beauty" },
  { label: "Hotels & Trips", value: "retail" },
  { label: "Education", value: "education" },
];

const CATEGORY_TILES: CategoryItem[] = [
  {
    id: "food",
    title: "Food & Drinks",
    subtitle: "Trending Now",
    image:
      "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "health",
    title: "Wellness",
    subtitle: "Restore More",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "beauty",
    title: "Beauty & Fitness",
    subtitle: "Treat Yourself",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "retail",
    title: "Hotels & Trips",
    subtitle: "Plan Escape",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "education",
    title: "Education",
    subtitle: "Learn More",
    image:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80",
  },
];

const LOCATION_OPTIONS = [
  "Select location",
  "Las Vegas, Nevada",
  "New York, USA",
  "Chicago, USA",
  "Los Angeles, USA",
];

const VOUCHER_FALLBACK: VoucherRow[] = [
  {
    id: "voucher-1",
    title: "$300 Off On Overall Bill",
    description:
      "Enjoy a premium dining discount on select menus and city experiences.",
    category: "food",
    code: "V2200A - Active",
    merchant: "ABC Merchant",
    liveDate: "2025-11-20",
    endDate: "2025-11-30",
    location: "Las Vegas, Nevada",
    image: "/customer/thumbnail.png",
  },
  {
    id: "voucher-2",
    title: "$200 Off On Weekend Combo",
    description:
      "Save more on curated weekend packages built for friends and families.",
    category: "retail",
    code: "V2400B - Active",
    merchant: "ABC Merchant",
    liveDate: "2025-11-22",
    endDate: "2025-12-05",
    location: "Las Vegas, Nevada",
    image: "/customer/thumbnail.png",
  },
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
  const labels: Record<string, string> = {
    food: "Food & Drinks",
    health: "Wellness",
    beauty: "Beauty & Fitness",
    retail: "Hotels & Trips",
    education: "Education",
  };

  if (!category) return "General";
  return labels[category] ?? category;
}

function buildVoucherRows() {
  return Array.from({ length: 8 }).map((_, index) => {
    const item = VOUCHER_FALLBACK[index % VOUCHER_FALLBACK.length];
    return {
      ...item,
      id: `${item.id}-${index}`,
    };
  });
}

function toCouponCard(deal: Deal, location: string): DashboardCard {
  return {
    id: deal.id,
    title: deal.title,
    description:
      deal.description ||
      "Enjoy premium local offers with flexible savings on every order.",
    categoryLabel: mapDealCategory(deal.category),
    code: `${deal.coupontoolsCouponId || deal.id} - Active`,
    merchant: deal.merchantName,
    liveDate: formatDate(deal.startDate),
    endDate: formatDate(deal.endDate),
    location,
    imageSrc:
      deal.thumbnailUrl ||
      deal.images?.[0] ||
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
  };
}

function toVoucherCard(voucher: VoucherRow, location: string): DashboardCard {
  return {
    id: voucher.id,
    title: voucher.title,
    description: voucher.description,
    categoryLabel: mapDealCategory(voucher.category),
    code: voucher.code,
    merchant: voucher.merchant,
    liveDate: voucher.liveDate,
    endDate: voucher.endDate,
    location,
    imageSrc: voucher.image,
  };
}

export default function Page() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("Select location");
  const [activeTab, setActiveTab] = useState<DashboardTab>("coupons");
  const [visibleCount, setVisibleCount] = useState(8);
  const [deals, setDeals] = useState<Deal[]>(getDummyDeals());
  const [user, setUser] = useState<UserProfile>({
    name: "My Account",
    email: "account@polokaz.com",
    image: null,
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    router.prefetch("/customer/dashboard");
    router.prefetch("/customer/coupons");
  }, [router]);

  useEffect(() => {
    async function loadSession() {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          setUser({
            name: session.data.user.name,
            email: session.data.user.email,
            image: session.data.user.image,
          });
        }
      } catch {
        // Keep fallback profile when session is unavailable on first paint.
      }
    }

    async function loadDeals() {
      try {
        const response = await fetch(`${API_URL}/api/deals?limit=20`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch deals");
        }

        const data = await response.json();
        if (Array.isArray(data.deals) && data.deals.length > 0) {
          setDeals(data.deals);
        }
      } catch {
        setDeals(getDummyDeals());
      }
    }

    loadSession();
    loadDeals();
  }, []);

  useEffect(() => {
    setVisibleCount(8);
  }, [activeTab, searchQuery, selectedCategory, selectedLocation]);

  const normalizedSearch = searchQuery.toLowerCase();

  const couponCards = useMemo(() => {
    const location =
      selectedLocation === "Select location"
        ? "Las Vegas, Nevada"
        : selectedLocation;

    return deals
      .filter((deal) => {
        const matchesSearch =
          !normalizedSearch ||
          deal.title.toLowerCase().includes(normalizedSearch) ||
          deal.merchantName.toLowerCase().includes(normalizedSearch) ||
          deal.description?.toLowerCase().includes(normalizedSearch);

        const matchesCategory =
          selectedCategory === "all" || deal.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .map((deal) => toCouponCard(deal, location));
  }, [deals, normalizedSearch, selectedCategory, selectedLocation]);

  const voucherCards = useMemo(() => {
    const location =
      selectedLocation === "Select location"
        ? "Las Vegas, Nevada"
        : selectedLocation;

    return buildVoucherRows()
      .filter((voucher) => {
        const matchesSearch =
          !normalizedSearch ||
          voucher.title.toLowerCase().includes(normalizedSearch) ||
          voucher.merchant.toLowerCase().includes(normalizedSearch) ||
          voucher.description.toLowerCase().includes(normalizedSearch);

        const matchesCategory =
          selectedCategory === "all" || voucher.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .map((voucher) => toVoucherCard(voucher, location));
  }, [normalizedSearch, selectedCategory, selectedLocation]);

  const cards = activeTab === "coupons" ? couponCards : voucherCards;
  const visibleCards = cards.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-[#eef2f7] text-[#15253b]">
      <header className="sticky top-0 z-30 border-b border-[#dfe7f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center">
            <BrandLogo href="/" size="md" />
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <nav className="relative z-10 flex items-center gap-2 text-sm font-medium text-[#4b5c74]">
              <Link href="/" prefetch className="rounded-full px-4 py-2 transition hover:text-[#0f7af7]">
                Home
              </Link>
              <Link
                href="/customer/coupons"
                prefetch
                className="rounded-full px-4 py-2 text-[#0f7af7]"
              >
                Coupons
              </Link>
              <Link
                href="/customer/dashboard"
                prefetch
                className="rounded-full px-4 py-2 transition hover:text-[#0f7af7]"
              >
                Dashboard
              </Link>
              <a href="#" className="rounded-full px-4 py-2 transition hover:text-[#0f7af7]">
                Events
              </a>
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
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                  <Link href="/customer/dashboard" prefetch>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                  <Link href="/customer/coupons" prefetch>My Coupons</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                  <Link href="/referral" prefetch>Referral Program</Link>
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
              <Link href="/" prefetch className="rounded-xl px-2 py-1">
                Home
              </Link>
              <Link href="/customer/dashboard" prefetch className="rounded-xl px-2 py-1 text-[#0f7af7]">
                Coupons
              </Link>
              <Link href="/customer/coupons" prefetch className="rounded-xl px-2 py-1">
                Dashboard
              </Link>
              <a href="#" className="rounded-xl px-2 py-1">
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
          </div>
        ) : null}
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[26px] bg-white p-5 shadow-[0_18px_50px_rgba(20,42,79,0.08)] sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium text-[#7d8ea5]">
            <span className="text-[#24354f]">Coupons</span>
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            <span className="text-[#0f7af7]">Category</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-[#24354f]">
              Our Trending Categories
            </h2>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-semibold text-[#0f7af7]"
            >
              View all
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORY_TILES.map((category, index) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`group relative overflow-hidden rounded-[18px] text-left transition hover:-translate-y-0.5 ${
                  index === CATEGORY_TILES.length - 1
                    ? "lg:[&:not(:last-child)]:col-span-1"
                    : ""
                }`}
              >
                <div className="relative h-28">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,16,31,0.15)_0%,rgba(6,16,31,0.88)_100%)]" />
                  <div
                    className={`absolute inset-0 ring-2 transition ${
                      selectedCategory === category.id
                        ? "ring-[#0f7af7]"
                        : "ring-transparent group-hover:ring-white/30"
                    }`}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="text-sm font-semibold leading-tight">
                      {category.title}
                    </p>
                    <p className="mt-1 text-[11px] text-white/80">
                      {category.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 border-b border-[#edf1f6]">
            <div className="flex gap-8 text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("coupons")}
                className={`border-b-2 pb-3 transition ${
                  activeTab === "coupons"
                    ? "border-[#0f7af7] text-[#0f7af7]"
                    : "border-transparent text-[#1e2f46]"
                }`}
              >
                My Coupons
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vouchers")}
                className={`border-b-2 pb-3 transition ${
                  activeTab === "vouchers"
                    ? "border-[#0f7af7] text-[#0f7af7]"
                    : "border-transparent text-[#1e2f46]"
                }`}
              >
                My Vouchers
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-[18px] bg-[#f5f7fb] p-3 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[inset_0_0_0_1px_#e8edf5]">
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
              className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6f8197] outline-none shadow-[inset_0_0_0_1px_#e8edf5]"
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
              className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6f8197] outline-none shadow-[inset_0_0_0_1px_#e8edf5]"
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

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {visibleCards.map((card, index) => {
              const accent = index % 2 === 0;
              const badgeColor = accent ? "bg-[#0f7af7]" : "bg-[#ef8a23]";
              const buttonColor = accent
                ? "bg-[#0f7af7] hover:bg-[#0b66d1]"
                : "bg-[#ef8a23] hover:bg-[#d97712]";
              const borderColor = accent
                ? "border-[#bedcff]"
                : "border-[#ffd9ba]";

              return (
                <article
                  key={card.id}
                  className={`overflow-hidden rounded-[20px] border bg-white shadow-[0_12px_34px_rgba(18,40,74,0.08)] ${borderColor}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative h-44 sm:h-auto sm:w-[34%]">
                      <img
                        src={card.imageSrc}
                        alt={card.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[#0f1c2d]/18" />
                      <div
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold text-white ${badgeColor}`}
                      >
                        {card.categoryLabel}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold leading-tight text-[#1d2b40]">
                            {card.title}
                          </h3>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c8ca1]">
                            {card.code}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold text-white ${badgeColor}`}
                        >
                          {card.merchant}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[#6e8097]">
                        {card.description}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                        <div className="rounded-2xl bg-[#f8fbff] p-3">
                          <p className="font-medium text-[#97a6ba]">Live Date</p>
                          <p className="mt-1 font-semibold text-[#23354f]">
                            {card.liveDate}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#f8fbff] p-3">
                          <p className="font-medium text-[#97a6ba]">End Date</p>
                          <p className="mt-1 font-semibold text-[#23354f]">
                            {card.endDate}
                          </p>
                        </div>
                        <div className="col-span-2 rounded-2xl bg-[#f8fbff] p-3 sm:col-span-1">
                          <p className="font-medium text-[#97a6ba]">Location</p>
                          <p className="mt-1 font-semibold text-[#23354f]">
                            {card.location}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-end">
                        <button
                          type="button"
                          className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${buttonColor}`}
                        >
                          Get Now
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleCards.length === 0 ? (
            <div className="mt-6 rounded-[20px] border border-dashed border-[#ccdaea] bg-white px-6 py-12 text-center text-sm text-[#6e8097]">
              No results matched your current filters.
            </div>
          ) : null}

          {visibleCount < cards.length ? (
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
      </section>

      <footer className="bg-[#071425] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.7fr_0.9fr]">
            <div>
              <BrandLogo size="lg" />
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
