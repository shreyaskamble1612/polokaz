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
  Search as SearchIcon,
  X,
  Gift,
  Users,
  ArrowRight,
  Sparkles,
  Twitter,
  Linkedin,
  Youtube,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { formatCategoryName } from "@/lib/utils";

type UserProfile = {
  name: string;
  email: string;
  image?: string | null;
};

type MerchantData = {
  id: string;
  businessName: string;
  businessCategory: string | null;
  website: string | null;
  createdAt: string;
  companyAddress: string | null;
  activeDealsCount: number;
  redeemedCount: number;
};

const CATEGORIES = [
  {
    id: "food",
    title: "Food & Drink",
    subtitle: "Explore Now",
    image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=600&q=80",
    color: "bg-[#0f7af7]",
    borderColor: "border-[#bedcff]",
    buttonColor: "bg-[#0f7af7] hover:bg-[#0b66d1]"
  },
  {
    id: "health",
    title: "Wellness",
    subtitle: "Explore Now",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
    color: "bg-[#ef8a23]",
    borderColor: "border-[#ffd9ba]",
    buttonColor: "bg-[#ef8a23] hover:bg-[#d97712]"
  },
  {
    id: "beauty",
    title: "Beauty & Personal Care",
    subtitle: "Explore Now",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
    color: "bg-[#10b981]",
    borderColor: "border-[#a7f3d0]",
    buttonColor: "bg-[#10b981] hover:bg-[#059669]"
  },
  {
    id: "retail",
    title: "Retail & Shopping",
    subtitle: "Explore Now",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80",
    color: "bg-[#8b5cf6]",
    borderColor: "border-[#ddd6fe]",
    buttonColor: "bg-[#8b5cf6] hover:bg-[#7c3aed]"
  },
  {
    id: "education",
    title: "Education",
    subtitle: "Explore Now",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
    color: "bg-[#ec4899]",
    borderColor: "border-[#fbcfe8]",
    buttonColor: "bg-[#ec4899] hover:bg-[#db2777]"
  }
];

const LOCATION_OPTIONS = [
  "Select location",
  "Las Vegas, Nevada",
  "New York, USA",
  "Miami, Florida",
  "Los Angeles, California",
  "Chicago, Illinois"
];

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const FALLBACK_THEME = {
  id: "general",
  title: "General",
  subtitle: "Explore Now",
  image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80",
  color: "bg-[#64748b]",
  borderColor: "border-[#e2e8f0]",
  buttonColor: "bg-[#64748b] hover:bg-[#475569]"
};

function getCategoryTheme(category: string | null) {
  if (!category) return FALLBACK_THEME;
  const normalized = category.trim().toLowerCase();

  if (normalized.includes("food") || normalized.includes("dining") || normalized.includes("restaurant") || normalized.includes("drink")) {
    return CATEGORIES.find(c => c.id === "food") || FALLBACK_THEME;
  }
  if (normalized.includes("health") || normalized.includes("wellness") || normalized.includes("spa") || normalized.includes("fitness")) {
    return CATEGORIES.find(c => c.id === "health") || FALLBACK_THEME;
  }
  if (normalized.includes("beauty") || normalized.includes("personal care") || normalized.includes("salon")) {
    return CATEGORIES.find(c => c.id === "beauty") || FALLBACK_THEME;
  }
  if (normalized.includes("retail") || normalized.includes("shop") || normalized.includes("store") || normalized.includes("boutique")) {
    return CATEGORIES.find(c => c.id === "retail") || FALLBACK_THEME;
  }
  if (normalized.includes("education") || normalized.includes("class") || normalized.includes("learn")) {
    return CATEGORIES.find(c => c.id === "education") || FALLBACK_THEME;
  }

  const matched = CATEGORIES.find(c => c.id === normalized);
  return matched || FALLBACK_THEME;
}

function matchesCategoryHelper(dealCategory: string | null, selected: string | null): boolean {
  if (!selected) return true;
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
  const [user, setUser] = useState<UserProfile>({
    name: "My Account",
    email: "account@polokaz.com",
    image: null,
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [merchantsList, setMerchantsList] = useState<MerchantData[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingMerchants, setLoadingMerchants] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Select location");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/customer");
    router.prefetch("/customer/dashboard");
    router.prefetch("/customer/coupons");
  }, [router]);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionRes = await authClient.getSession();
        if (sessionRes.data?.user) {
          setUser({
            name: sessionRes.data.user.name,
            email: sessionRes.data.user.email,
            image: sessionRes.data.user.image,
          });
        }
      } catch (err) {
        console.error("Failed to load session", err);
      }
    }

    async function loadDeals() {
      setLoadingDeals(true);
      try {
        const data = await clientFetch<{ deals: Deal[] }>("/api/deals?limit=40");
        if (Array.isArray(data.deals)) {
          setDeals(data.deals);
        }
      } catch (err) {
        console.error("Failed to fetch deals", err);
        setDeals([]);
      } finally {
        setLoadingDeals(false);
      }
    }

    async function loadMerchants() {
      setLoadingMerchants(true);
      try {
        const data = await clientFetch<{ merchants: MerchantData[] }>("/api/merchants");
        if (Array.isArray(data.merchants)) {
          setMerchantsList(data.merchants);
        }
      } catch (err) {
        console.error("Failed to fetch merchants", err);
        setMerchantsList([]);
      } finally {
        setLoadingMerchants(false);
      }
    }

    loadSession();
    loadDeals();
    loadMerchants();
  }, []);

  // Filter deals based on search, location, and category
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // 1. Search Query Match
      const searchNormalized = appliedSearch.toLowerCase();
      const matchesSearch =
        !searchNormalized ||
        deal.title.toLowerCase().includes(searchNormalized) ||
        deal.merchantName.toLowerCase().includes(searchNormalized) ||
        deal.description?.toLowerCase().includes(searchNormalized);

      // 2. Category Match
      const matchesCategory = matchesCategoryHelper(deal.category, selectedCategory);

      // 3. Location Match (we aggregate locations from merchant addresses or mock locations)
      const merchantObj = merchantsList.find(m => m.id === deal.merchantId);
      const mAddress = deal.merchantLocation || merchantObj?.companyAddress || "Las Vegas, Nevada";
      const matchesLocation =
        selectedLocation === "Select location" ||
        mAddress.toLowerCase().includes(selectedLocation.split(",")[0].toLowerCase());

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [deals, appliedSearch, selectedCategory, selectedLocation, merchantsList]);

  // Limit to 8 for trending view as in mockup
  const trendingDeals = useMemo(() => {
    return filteredDeals.slice(0, 8);
  }, [filteredDeals]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery);
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null); // Toggle off
    } else {
      setSelectedCategory(categoryId);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#15253b] font-sans antialiased">
      {/* 1. Header Section */}
      <header className="sticky top-0 z-40 border-b border-[#dfe7f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center">
            <BrandLogo href="/customer" size="md" />
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <nav className="relative z-10 flex items-center gap-2 text-sm font-medium text-[#4b5c74]">
              <Link
                href="/customer"
                className="rounded-full px-4 py-2 text-[#0f7af7] bg-[#eef3fb] font-semibold"
              >
                Home
              </Link>
              <Link
                href="/customer/coupons"
                className="rounded-full px-4 py-2 transition hover:text-[#0f7af7] hover:bg-[#f5f7fb]"
              >
                Coupons
              </Link>
              <Link
                href="/customer/dashboard"
                className="rounded-full px-4 py-2 transition hover:text-[#0f7af7] hover:bg-[#f5f7fb]"
              >
                Dashboard
              </Link>
              <a
                href="#"
                className="rounded-full px-4 py-2 transition hover:text-[#0f7af7] hover:bg-[#f5f7fb]"
              >
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
                  <Avatar className="h-9 w-9 border border-[#d8e4f6]">
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
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-red-600 cursor-pointer">
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
              <Link href="/customer" className="rounded-xl px-3 py-2 bg-[#eef3fb] text-[#0f7af7] font-semibold">
                Home
              </Link>
              <Link href="/customer/coupons" className="rounded-xl px-3 py-2 hover:bg-[#f5f7fb]">
                Coupons
              </Link>
              <Link href="/customer/dashboard" className="rounded-xl px-3 py-2 hover:bg-[#f5f7fb]">
                Dashboard
              </Link>
              <a href="#" className="rounded-xl px-3 py-2 hover:bg-[#f5f7fb]">
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

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white h-[440px] flex items-center">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 duration-1000"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=80')` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
        
        {/* Decorative Radial Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(15,122,247,0.15),transparent_40%)]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-[1.1]">
              Grab the <br />
              <span className="text-[#3b82f6] italic font-black underline decoration-4 decoration-[#ef8a23]/80 underline-offset-4">Best Deals</span> <br />
              Around You!
            </h1>
            <p className="mt-6 text-base text-gray-300 sm:text-lg max-w-lg leading-relaxed">
              Discover exclusive coupons, restaurant offers & local deals personalized to your city. Save more, every single day.
            </p>
            <div className="mt-8">
              <button 
                onClick={() => {
                  const element = document.getElementById("trending-coupons");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
                className="group inline-flex items-center gap-2 rounded-full bg-[#0f7af7] px-6 py-3.5 text-sm font-semibold text-white transition-all shadow-[0_4px_20px_rgba(15,122,247,0.4)] hover:bg-[#0b66d1] hover:shadow-[0_4px_25px_rgba(15,122,247,0.6)] hover:-translate-y-0.5 active:translate-y-0"
              >
                View Deals
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search & Location Bar */}
      <section className="relative z-25 -mt-8 mx-auto max-w-5xl px-4 sm:px-6">
        <form 
          onSubmit={handleSearchSubmit}
          className="grid gap-3 rounded-3xl bg-white p-3.5 shadow-[0_20px_50px_rgba(20,42,79,0.12)] border border-[#dfe7f2]/60 lg:grid-cols-[1.5fr_1.1fr_auto]"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-[#f5f8fc] px-4 py-3 border border-transparent focus-within:border-[#0f7af7]/30 focus-within:bg-white duration-200">
            <SearchIcon className="h-4 w-4 text-[#8a9db5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Restaurants, Coupons, categories..."
              className="w-full bg-transparent text-sm text-[#1e2f46] outline-none placeholder:text-[#90a3bc]"
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#f5f8fc] px-4 py-3 border border-transparent focus-within:border-[#0f7af7]/30 focus-within:bg-white duration-200">
            <MapPin className="h-4 w-4 text-[#8a9db5]" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-transparent text-sm text-[#5a6e87] outline-none"
              aria-label="Select location filter"
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-2xl bg-[#0f7af7] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0b66d1] hover:-translate-y-0.5"
          >
            Search
          </button>
        </form>
      </section>

      {/* 4. Trending Categories Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[#dfe7f2] pb-4">
          <h2 className="text-xl font-bold tracking-tight text-[#15253b] sm:text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#ef8a23]" />
            Our Trending Categories
          </h2>
          <Link 
            href="/customer/coupons"
            className="text-sm font-semibold text-[#0f7af7] hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryClick(category.id)}
                className="group relative overflow-hidden rounded-2xl text-left h-32 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg focus:outline-none"
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient Overlays based on state */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${
                  isSelected 
                    ? "bg-[#0f7af7]/75" 
                    : "bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95"
                }`} />

                {/* Ring selection highlight */}
                <div className={`absolute inset-0 border-2 rounded-2xl transition-colors duration-300 ${
                  isSelected ? "border-white" : "border-transparent group-hover:border-white/30"
                }`} />

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                  <p className="text-sm font-bold leading-tight tracking-tight">
                    {category.title}
                  </p>
                  <p className="mt-1 text-[10px] text-white/80 uppercase font-semibold tracking-wider">
                    {isSelected ? "Selected" : category.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Trending Coupons Section */}
      <section id="trending-coupons" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[#dfe7f2] pb-4">
          <h2 className="text-xl font-bold tracking-tight text-[#15253b] sm:text-2xl flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#0f7af7]" />
            Our Trending Coupons
          </h2>
          <Link
            href="/customer/coupons"
            className="text-sm font-semibold text-[#0f7af7] hover:underline"
          >
            View all
          </Link>
        </div>

        {loadingDeals ? (
          <div className="mt-12 flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0f7af7] border-t-transparent" />
          </div>
        ) : trendingDeals.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#ccd9eb] bg-white px-6 py-16 text-center shadow-sm">
            <Gift className="mx-auto h-12 w-12 text-[#9daec2]" />
            <p className="mt-4 text-base font-semibold text-[#3a4c62]">No coupons match your filters</p>
            <p className="mt-1 text-sm text-[#7e92ab]">Try clearing your search query or choosing a different category.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setAppliedSearch("");
                setSelectedLocation("Select location");
                setSelectedCategory(null);
              }}
              className="mt-5 rounded-full bg-[#0f7af7] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0b66d1]"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            {trendingDeals.map((deal) => {
              const theme = getCategoryTheme(deal.category);
              const merchantObj = merchantsList.find(m => m.id === deal.merchantId);
              const mAddress = deal.merchantLocation || merchantObj?.companyAddress || "Las Vegas, Nevada";

              return (
                <article
                  key={deal.id}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col sm:flex-row ${theme.borderColor}`}
                >
                  {/* Coupon Image Left */}
                  <div className="relative h-48 overflow-hidden sm:h-auto sm:w-[35%] shrink-0">
                    <img
                      src={deal.thumbnailUrl || deal.images?.[0] || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"}
                      alt={deal.title}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10" />
                    
                    {/* Category Label on Image */}
                    <div
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider ${theme.color}`}
                    >
                      {formatCategoryName(deal.category)}
                    </div>
                  </div>

                  {/* Coupon Content Right */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-extrabold leading-snug text-[#1d2b40] group-hover:text-[#0f7af7]">
                            {deal.title}
                          </h3>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold text-white shrink-0 shadow-sm ${theme.color}`}
                        >
                          {deal.merchantName}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-[#5e7087]">
                        {deal.description || "Enjoy premium savings with our exclusive local merchant offers."}
                      </p>

                      {/* Dates & Location grid */}
                      <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-3">
                        <div className="rounded-xl bg-[#f8fbff] p-2.5 border border-[#ebf2fa]">
                          <p className="font-semibold text-[#8ca1b9] uppercase text-[9px] tracking-wider">Live Date</p>
                          <p className="mt-0.5 font-bold text-[#23354f]">
                            {formatDate(deal.startDate)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#f8fbff] p-2.5 border border-[#ebf2fa]">
                          <p className="font-semibold text-[#8ca1b9] uppercase text-[9px] tracking-wider">End Date</p>
                          <p className="mt-0.5 font-bold text-[#23354f]">
                            {formatDate(deal.endDate)}
                          </p>
                        </div>
                        <div className="col-span-2 rounded-xl bg-[#f8fbff] p-2.5 border border-[#ebf2fa] sm:col-span-1">
                          <p className="font-semibold text-[#8ca1b9] uppercase text-[9px] tracking-wider">Location</p>
                          <p className="mt-0.5 font-bold text-[#23354f] truncate" title={mAddress}>
                            {mAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                      <Link
                        href={`/deals/${deal.id}`}
                        className={`rounded-full px-6 py-2.5 text-xs font-bold text-white transition-all shadow-sm ${theme.buttonColor}`}
                      >
                        Get Now
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Referral Program Banner Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#072f5f_0%,#0f56a5_60%,#1b3a62_100%)] px-8 py-10 shadow-[0_20px_50px_rgba(7,47,95,0.25)] text-white lg:px-12">
          {/* Circular glow overlays */}
          <div className="absolute -right-36 -top-36 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -left-36 -bottom-36 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Referral Program
              </div>

              <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl leading-tight">
                Invite Friend, <br />
                Earn <span className="text-[#3b82f6] italic font-black underline decoration-4 decoration-amber-400 underline-offset-4">Real Rewards</span>
              </h2>

              <p className="mt-5 text-sm text-gray-300 max-w-lg leading-relaxed">
                Invite your friends to join Polokaz and enjoy exciting rewards together. Share your unique referral code with your friends and earn benefits every time they sign up using your code.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/referral"
                  className="rounded-full bg-white px-6 py-3 text-xs font-bold text-[#072f5f] shadow-md transition-all hover:bg-gray-100 hover:-translate-y-0.5"
                >
                  Invite a Friend
                </Link>
                <Link
                  href="/referral"
                  className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Know More
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right Column Timeline */}
            <div className="flex flex-col gap-6 lg:border-l lg:border-white/15 lg:pl-10">
              <div className="flex items-center justify-between rounded-2xl bg-white/10 p-5 border border-white/10 backdrop-blur-md">
                <div>
                  <p className="text-2xl font-black text-amber-300 italic">$5.00</p>
                  <p className="text-xs text-white/80 mt-1 uppercase font-semibold tracking-wider">Per successful referral</p>
                </div>
                <div className="rounded-full bg-amber-400 p-2.5 text-slate-900 shadow-lg">
                  <Gift className="h-5 w-5" />
                </div>
              </div>

              {/* Steps timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/20">
                {[
                  { step: "1", title: "Share Link", desc: "Copy your unique link and send it to friends." },
                  { step: "2", title: "Friend Signs Up", desc: "Ensure your friend registers on Polokaz." },
                  { step: "3", title: "Get Reward", desc: "Receive points or cash credit directly in your wallet." }
                ].map((item) => (
                  <div key={item.step} className="relative flex gap-4">
                    <span className="absolute -left-[23px] top-1 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-900 shadow-md">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold">{item.title}</h4>
                      <p className="text-[11px] text-gray-300 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Trending Merchants Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[#dfe7f2] pb-4">
          <h2 className="text-xl font-bold tracking-tight text-[#15253b] sm:text-2xl flex items-center gap-2">
            <Users className="h-5 w-5 text-[#ef8a23]" />
            Our Trending Merchants
          </h2>
          <a
            href="#"
            className="text-sm font-semibold text-[#0f7af7] hover:underline"
          >
            View all
          </a>
        </div>

        {loadingMerchants ? (
          <div className="mt-12 flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ef8a23] border-t-transparent" />
          </div>
        ) : merchantsList.length === 0 ? (
          <div className="mt-8 text-center text-sm text-[#6e8097] py-12 bg-white rounded-2xl border">
            No trending merchants found.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {merchantsList.map((m) => {
              const address = m.companyAddress || "Las Vegas, Nevada";
              const tag = getCategoryTheme(m.businessCategory);
              // Choose Unsplash photo corresponding to businessName or category
              let coverUrl = tag.image;
              if (m.businessName.includes("Burger")) coverUrl = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80";
              if (m.businessName.includes("Urban")) coverUrl = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80";
              if (m.businessName.includes("Glowup")) coverUrl = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80";

              return (
                <article
                  key={m.id}
                  className="group overflow-hidden rounded-3xl bg-white border border-[#ebeff5] shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200"
                >
                  {/* Cover Photo */}
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={coverUrl}
                      alt={m.businessName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/15" />
                    
                    {/* Tiny badge */}
                    <div className="absolute right-3 top-3 rounded-full bg-black/55 backdrop-blur px-2.5 py-0.5 text-[9px] text-white font-semibold">
                      ★ 4.8
                    </div>
                  </div>

                  {/* Merchant Info Body */}
                  <div className="relative p-5 pt-7">
                    {/* Overlay Avatar */}
                    <div className="absolute -top-6 left-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 border shadow-sm">
                        <Avatar className="h-full w-full">
                          <AvatarFallback className={`${tag.color} text-white font-bold text-sm`}>
                            {m.businessName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-[#1d2b40] group-hover:text-[#0f7af7] transition">
                          {m.businessName}
                        </h3>
                        <p className="mt-1 text-[11px] font-semibold text-[#8ca1b9] flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {address}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#ffa41c] flex items-center gap-0.5">
                        <Star className="h-3.5 w-3.5 fill-[#ffa41c] text-[#ffa41c]" />
                        4.8 <span className="text-gray-400 font-normal">(313)</span>
                      </span>
                    </div>

                    {/* Category Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[#f1f6fc] px-2.5 py-0.5 text-[10px] font-bold text-[#567191] uppercase tracking-wide">
                        {formatCategoryName(m.businessCategory)}
                      </span>
                      {m.businessName.includes("Burger") && (
                        <span className="rounded-full bg-[#f1f6fc] px-2.5 py-0.5 text-[10px] font-bold text-[#567191] uppercase tracking-wide">
                          Wellness
                        </span>
                      )}
                    </div>

                    <DropdownMenuSeparator className="my-4 bg-[#ebf0f7]" />

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="border-r border-[#ebf0f7]">
                        <p className="text-lg font-black text-[#1d2b40]">{m.activeDealsCount}</p>
                        <p className="text-[10px] text-[#8ca1b9] font-bold uppercase tracking-wider mt-0.5">Active Deals</p>
                      </div>
                      <div>
                        <p className="text-lg font-black text-emerald-600">
                          {m.activeDealsCount > 0 ? `${Math.round((m.redeemedCount / (m.activeDealsCount + m.redeemedCount || 1)) * 100)}%` : "14%"}
                        </p>
                        <p className="text-[10px] text-[#8ca1b9] font-bold uppercase tracking-wider mt-0.5">Redeemed</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 8. Footer Section */}
      <footer className="bg-[#071425] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr_1fr]">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3">
                <BrandLogo href="/customer" size="lg" />
              </div>
              <p className="mt-2 text-xs text-white/50">Save more, locally.</p>

              <p className="mt-5 max-w-sm text-xs leading-relaxed text-white/60">
                We connect users with the best nearby restaurants, cafes, stores, and service providers to help you save more while enjoying your favorite experiences.
              </p>

              {/* Social icons */}
              <div className="mt-6 flex items-center gap-3">
                {[
                  { Icon: Facebook, link: "#" },
                  { Icon: Twitter, link: "#" },
                  { Icon: Instagram, link: "#" },
                  { Icon: Linkedin, link: "#" }
                ].map((item, index) => {
                  const IconComponent = item.Icon;
                  return (
                    <a
                      key={index}
                      href={item.link}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 hover:border-white/20"
                    >
                      <IconComponent className="h-4 w-4 text-[#85c2ff]" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4da4ff]">
                Important Links
              </h3>
              <ul className="mt-5 space-y-2.5 text-xs text-white/70">
                <li>
                  <Link href="/customer/coupons" className="hover:text-white transition">Coupons</Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">Events</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">About us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">Career</a>
                </li>
                <li>
                  <Link href="/plans" className="hover:text-white transition">Subscription</Link>
                </li>
              </ul>
            </div>

            {/* Contact details column */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4da4ff]">
                Contact Us
              </h3>
              <div className="mt-5 space-y-3.5 text-xs text-white/70">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#85c2ff] shrink-0" />
                  <p>ABC Company, 123 East 7th Street, St. Louis 10001</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[#85c2ff] shrink-0" />
                  <p>(123) 456-7890</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#85c2ff] shrink-0" />
                  <p>polokaz@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; 2026 ABC Company. All Rights Reserved.</p>
            <div className="flex items-center gap-5">
              <button type="button" className="hover:text-white transition">Help Center</button>
              <button type="button" className="hover:text-white transition">Privacy Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
