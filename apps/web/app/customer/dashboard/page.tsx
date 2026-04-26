"use client";

import { useEffect, useState } from "react";
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
import { getDummyDeals } from "@/lib/api/deals";
import {
  ChevronDown,
  ChevronRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  Share2,
  Star,
  TicketPercent,
  UserPlus,
  Wallet,
} from "lucide-react";
import Link from "next/link";

type UserProfile = {
  name: string;
  email: string;
  image?: string | null;
};
// In a real application, these would come from your backend or an API. For this example, we're hardcoding them for demonstration purposes.
const CATEGORIES = [
  {
    id: "food",
    title: "Food & Drinks",
    subtitle: "7 Deals",
    image:
      "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "health",
    title: "Wellness",
    subtitle: "5 Deals",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "beauty",
    title: "Beauty & Fitness",
    subtitle: "8 Deals",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "retail",
    title: "Hotels & Trips",
    subtitle: "6 Deals",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "retail-2",
    title: "Education",
    subtitle: "3 Deals",
    image:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80",
  },
];

// In a real application, these would come from your backend or an API. For this example, we're hardcoding them for demonstration purposes.
const MERCHANTS = [
  {
    id: "m1",
    name: "Burger Republic",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    offers: "25",
    redeemed: "1.4 K",
  },
  {
    id: "m2",
    name: "Urban Threads",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
    offers: "18",
    redeemed: "980",
  },
  {
    id: "m3",
    name: "Glowup Studio",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
    offers: "21",
    redeemed: "1.2 K",
  },
  {
    id: "m4",
    name: "Sunset Cafe",
    rating: "4.6",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
    offers: "12",
    redeemed: "740",
  },
];

const LOCATION_OPTIONS = ["Select location", "New York", "Las Vegas", "Chicago"];
function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCategoryLabel(category: string | null) {
  if (!category) return "General";

  const map: Record<string, string> = {
    food: "Food & Shopping",
    health: "Health & Wellness",
    beauty: "Beauty & Fitness",
    retail: "Travel & Shopping",
  };

  return map[category] ?? category;
}

function getDealAccent(index: number) {
  return index % 2 === 0
    ? {
        badge: "bg-[#0f7af7]",
        button: "bg-[#0f7af7] hover:bg-[#0b67d2]",
        border: "border-[#b8d9ff]",
      }
    : {
        badge: "bg-[#ef8a23]",
        button: "bg-[#ef8a23] hover:bg-[#d97611]",
        border: "border-[#ffd7b0]",
      };
}
// In a real application, these would come from your backend or an API. For this example, we're hardcoding them for demonstration purposes.
export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Select location");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [user, setUser] = useState<UserProfile>({
    name: "My Account",
    email: "account@polokaz.com",
    image: null,
  });
  const deals = getDummyDeals();

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

    loadSession();
  }, []);

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      !searchQuery ||
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || deal.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#182433]">
      <header className="sticky top-0 z-20 border-b border-[#e6edf7] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f7af7] text-white shadow-[0_10px_24px_rgba(15,122,247,0.24)]">
              <TicketPercent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0f7af7]">
                Polokaz
              </p>
              <p className="text-xs text-[#728197]">Deals around you</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#43526a] md:flex">
            <a href="#" className="text-[#0f7af7]">
              Home
            </a>
            <a href="#">Coupons</a>
            <a href="#">Dashboard</a>
            <a href="#">Events</a>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hidden items-center gap-3 rounded-full bg-[#eef3fb] px-3 py-2 text-left transition hover:bg-[#e7eef9] md:flex"
              >
                <Avatar className="h-10 w-10 border border-[#d9e5f7]">
                  <AvatarImage src={user.image ?? ""} alt={user.name} />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[15px] font-medium text-[#314560]">
                  {user.name}
                </span>
                <ChevronDown className="h-4 w-4 text-[#73849a]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-64 rounded-2xl border-[#dfe8f5] p-2 shadow-[0_20px_50px_rgba(25,42,70,0.12)]"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-[#d9e5f7]">
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
                <Link href="/customer/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                <Link href="/customer/coupons">My Coupons</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                <Link href="/referral">Referral Program</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e8eef7]" />
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-[#c2410c] focus:bg-[#fff2e8] focus:text-[#c2410c]">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e5f7] text-[#23405f] md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] bg-[#071320] shadow-[0_30px_80px_rgba(7,19,32,0.18)]">
          <div className="relative min-h-[480px]">
            <img
              src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=80"
              alt="Featured food deals"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,11,24,0.9)_0%,rgba(4,11,24,0.72)_35%,rgba(4,11,24,0.32)_100%)]" />

            <div className="relative flex min-h-[480px] flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                  <span className="text-lg">USA</span>
                  <span className="h-8 w-px bg-white/25" />
                  <span>Featured Picks</span>
                </div>
              </div>

              <div className="max-w-xl">
                <h1 className="text-4xl font-black italic leading-[0.98] text-white sm:text-5xl lg:text-[4.2rem]">
                  Grab the
                  <span className="block text-[#0f7af7]">Best Deals</span>
                  <span className="block">Around You!</span>
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
                  Discover exclusive coupons, restaurant offers and local city
                  specials tailored just for you. Save more, every single day.
                </p>
                <button
                  type="button"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0f7af7] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(15,122,247,0.35)] transition hover:bg-[#0b67d2]"
                >
                  View Deals
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="-mt-8 relative z-10 px-1">
          <div className="grid gap-3 rounded-[24px] border border-[#e8eef7] bg-white p-3 shadow-[0_24px_50px_rgba(15,42,76,0.08)] md:grid-cols-[1.5fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl border border-[#e9eef6] px-4 py-3">
              <Search className="h-4 w-4 text-[#92a2b7]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search restaurants, coupons, categories..."
                className="w-full bg-transparent text-sm text-[#23324a] outline-none placeholder:text-[#9aabc0]"
              />
            </label>

            <select
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="rounded-2xl border border-[#e9eef6] px-4 py-3 text-sm text-[#6a7d94] outline-none"
            >
              {LOCATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="rounded-2xl bg-[#0f7af7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b67d2]"
            >
              Search
            </button>
          </div>
        </section>

        <section className="pt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#22334d]">
              Our Trending Categories
            </h2>
            <button
              type="button"
              className="text-sm font-semibold text-[#0f7af7]"
            >
              View all
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className="group overflow-hidden rounded-[20px] bg-white text-left shadow-[0_16px_40px_rgba(26,50,93,0.08)] transition hover:-translate-y-1"
              >
                <div className="relative h-36">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,16,33,0)_0%,rgba(5,16,33,0.85)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-base font-semibold">{category.title}</p>
                    <p className="text-xs text-white/80">{category.subtitle}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="pt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#22334d]">
              Our Trending Coupons
            </h2>
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className="text-sm font-semibold text-[#0f7af7]"
            >
              View all
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {filteredDeals.map((deal, index) => {
              const accent = getDealAccent(index);

              return (
                <article
                  key={deal.id}
                  className={`overflow-hidden rounded-[22px] border bg-white shadow-[0_16px_40px_rgba(24,42,70,0.08)] ${accent.border}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative h-52 sm:h-auto sm:w-[32%]">
                      <img
                        src={
                          deal.thumbnailUrl ||
                          deal.images?.[0] ||
                          "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80"
                        }
                        alt={deal.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[#0d1725]/20" />
                      <div
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold text-white ${accent.badge}`}
                      >
                        {getCategoryLabel(deal.category)}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-bold leading-tight text-[#1d2b40]">
                            {deal.title}
                          </h3>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d8ea5]">
                            {deal.coupontoolsCouponId || deal.id} - Active
                          </p>
                        </div>
                        <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#0f7af7]">
                          {deal.merchantName}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[#708198]">
                        {deal.description ||
                          "Enjoy handpicked local offers with limited-time savings."}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#7b8aa0] sm:grid-cols-3">
                        <div className="rounded-2xl bg-[#f8fbff] p-3">
                          <p className="font-medium text-[#97a6ba]">Live Date</p>
                          <p className="mt-1 font-semibold text-[#253650]">
                            {formatDate(deal.startDate)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#f8fbff] p-3">
                          <p className="font-medium text-[#97a6ba]">End Date</p>
                          <p className="mt-1 font-semibold text-[#253650]">
                            {formatDate(deal.endDate)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#f8fbff] p-3 col-span-2 sm:col-span-1">
                          <p className="font-medium text-[#97a6ba]">Location</p>
                          <p className="mt-1 font-semibold text-[#253650]">
                            {selectedLocation === "Select location"
                              ? "Las Vegas, Nevada"
                              : selectedLocation}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-end">
                        <button
                          type="button"
                          className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${accent.button}`}
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

          {filteredDeals.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#cddced] bg-white px-6 py-12 text-center text-sm text-[#718199]">
              No coupons matched your search.
            </div>
          ) : null}
        </section>

        <section className="pt-12">
          <div className="overflow-hidden rounded-[26px] bg-[linear-gradient(90deg,#0e4f93_0%,#1469c4_55%,#1f83ee_100%)] text-white shadow-[0_28px_70px_rgba(8,64,130,0.24)]">
            <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.5fr_0.9fr] lg:px-8">
              <div>
                <span className="inline-flex rounded-full bg-white/14 px-3 py-1 text-xs font-semibold">
                  Referral Program
                </span>
                <h2 className="mt-4 max-w-md text-4xl font-black italic leading-tight sm:text-5xl">
                  Invite Friend,
                  <span className="block text-[#7fc2ff]">Earn Real Rewards</span>
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/84">
                  Invite your friends to join Polokaz and enjoy exciting
                  rewards. Share your unique referral code and unlock bonus
                  savings for every successful signup.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-[#0f7af7] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,122,247,0.25)]"
                  >
                    Invite a Friend
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Know More
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] bg-white/10 p-5 backdrop-blur">
                <div className="rounded-[22px] bg-[linear-gradient(135deg,#58b4ff_0%,#0f7af7_100%)] px-5 py-4 text-center shadow-[0_16px_30px_rgba(0,0,0,0.15)]">
                  <p className="text-4xl font-black">$5.00</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/80">
                    Per successful referral
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      icon: Share2,
                      title: "Share Link",
                    },
                    {
                      icon: UserPlus,
                      title: "Friend Signs Up",
                    },
                    {
                      icon: Wallet,
                      title: "Get Reward",
                    },
                  ].map((step, index) => (
                    <div
                      key={step.title}
                      className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <step.icon className="h-4 w-4 text-[#a9d7ff]" />
                      <p className="text-sm font-medium">{step.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-12 pb-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#22334d]">
              Our Trending Merchants
            </h2>
            <button
              type="button"
              className="text-sm font-semibold text-[#0f7af7]"
            >
              View all
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {MERCHANTS.map((merchant) => (
              <article
                key={merchant.id}
                className="overflow-hidden rounded-[20px] bg-white shadow-[0_16px_40px_rgba(21,44,80,0.08)]"
              >
                <div className="relative h-32">
                  <img
                    src={merchant.image}
                    alt={merchant.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,13,26,0)_0%,rgba(3,13,26,0.72)_100%)]" />
                  <div className="absolute right-3 top-3 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#0f7af7]">
                    Open
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#21334d]">
                        {merchant.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#8392a7]">
                        <Star className="h-3.5 w-3.5 fill-[#ef8a23] text-[#ef8a23]" />
                        <span>{merchant.rating}</span>
                        <span>-</span>
                        <span>4.8/5.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-[18px] bg-[#f6f9fd] p-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-[#1d2b40]">
                        {merchant.offers}
                      </p>
                      <p className="text-xs text-[#8091a6]">Active Deals</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#1d2b40]">
                        {merchant.redeemed}
                      </p>
                      <p className="text-xs text-[#8091a6]">Redeemed</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="bg-[#071425] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.7fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f7af7]">
                  <TicketPercent className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4da4ff]">
                    Polokaz
                  </p>
                  <p className="text-xs text-white/60">Save more, locally.</p>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/68">
                We connect users with the best nearby restaurants, cafes,
                stores and service providers to help you explore more while
                saving on your favorite experiences.
              </p>

              <div className="mt-6 flex items-center gap-3">
                {[Facebook, Instagram, Mail].map((Icon, index) => (
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
