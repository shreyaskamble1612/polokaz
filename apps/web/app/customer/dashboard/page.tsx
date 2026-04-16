"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MagnifyingGlassIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { DealCard } from "@/components/customer/deal-card";
import { CategoryCard } from "@/components/customer/category-card";
import { getDummyDeals, type Deal } from "@/lib/api/deals";

const CATEGORIES = [
  {
    id: "food",
    title: "Food & Drink",
    description:
      "Indulge in wholesome and flavorful options made with sustainable and organic produce.",
  },
  {
    id: "health",
    title: "Health & Wellness",
    description:
      "Access resources for stress management, mindfulness, and achieving your personal health goals.",
  },
  {
    id: "beauty",
    title: "Beauty & Personal Care",
    description:
      "Enhance your natural glow with skincare, makeup, and grooming essentials.",
  },
  {
    id: "retail",
    title: "Retail & Shopping",
    description:
      "Shop a wide range of products from trusted stores and local boutiques.",
  },
];

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load dummy deals on mount
  useEffect(() => {
    const dummyDeals = getDummyDeals();
    setDeals(dummyDeals);
    setFilteredDeals(dummyDeals);
  }, []);

  // Filter deals based on search and category
  useEffect(() => {
    let filtered = deals;

    if (searchQuery) {
      filtered = filtered.filter(
        (deal) =>
          deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((deal) => deal.category === selectedCategory);
    }

    setFilteredDeals(filtered);
  }, [searchQuery, selectedCategory, deals]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  const handleCategoryExplore = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Scroll to coupons section
    document
      .getElementById("trending-coupons")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGetDeal = (dealId: string) => {
    // TODO: Add to wallet or navigate to deal details
    alert(`Adding deal ${dealId} to wallet!`);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Top Nav */}
      <header className="w-full border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Polokaz logo"
              className="h-12 w-auto mr-20"
            />
          </div>

          <nav className="hidden items-center gap-10 text-[20px] font-inter md:flex">
            <a className="font-medium text-[#0378ED]" href="#">
              Home
            </a>
            <a className="font-light text-black" href="#">
              Coupons
            </a>
            <a className="font-light text-black" href="#">
              Events
            </a>
            <a className="font-light text-black" href="#">
              Dashboard
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/avatar.png" />
              <AvatarFallback>RM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-4 pt-10">
          <div className="grid overflow-hidden rounded-2xl shadow-sm md:h-[420px] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Image side */}
            <div className="h-[260px] md:h-auto">
              <img
                src="/customer/hero.png"
                alt="Hero"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Blue panel */}
            <div className="flex flex-col items-center justify-center bg-[#0378ED] px-8 py-10 text-center text-white">
              <p className="mb-6 font-roboto text-2xl leading-tight md:text-[36px]">
                Grab the best Deals on restaurants around you
              </p>
              <button className="relative inline-flex items-center justify-center rounded-[20px] border-2 border-[#0378ED] bg-white px-10 py-3 font-roboto text-xl font-bold text-[#0378ED] md:text-2xl">
                <span className="absolute inset-0 rounded-[20px] border border-[#0378ED]" />
                Read More
              </button>
            </div>
          </div>

          {/* Search + Location */}
          <form
            onSubmit={handleSearch}
            className="mt-8 flex flex-col gap-4 lg:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-[#E3E3E3] bg-white px-4 py-2">
              <MagnifyingGlassIcon className="h-6 w-6 text-[#ABABAB]" />
              <input
                type="text"
                placeholder="Search here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 font-inter text-[20px] text-gray-900 placeholder:text-[#ABABAB] outline-none bg-transparent"
              />
            </div>
            <div className="flex w-full items-center gap-3 rounded-xl border border-[#E3E3E3] bg-white px-4 py-2 lg:w-[380px]">
              <input
                type="text"
                placeholder="Select location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="flex-1 font-inter text-[20px] text-gray-900 placeholder:text-[#ABABAB] outline-none bg-transparent"
              />
              <ChevronDownIcon className="h-5 w-5 text-[#5F6368]" />
            </div>
          </form>
        </div>
      </section>

      {/* Trending Categories */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-inter text-[24px]">Our Trending Categories</h2>
          <button
            onClick={() => setSelectedCategory(null)}
            className="font-inter text-[16px] text-[#0378ED] hover:underline"
          >
            {selectedCategory ? "Clear filter" : "View all"}
          </button>
        </div>

        <div className="relative">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.title}
                description={category.description}
                onExplore={() => handleCategoryExplore(category.id)}
              />
            ))}
          </div>

          {/* Right arrow bubble */}
          <button className="absolute -right-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#E4FFE9] bg-white shadow xl:flex">
            <span className="h-6 w-3 bg-[#666666]" />
          </button>
        </div>
      </section>

      {/* Trending Coupons */}
      <section id="trending-coupons" className="mx-auto max-w-6xl px-4 pt-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-inter text-[24px]">
            Our Trending Coupons
            {selectedCategory && (
              <span className="ml-2 text-[16px] text-[#7A7A7A]">
                ({filteredDeals.length} results)
              </span>
            )}
          </h2>
          <button
            onClick={() => setSelectedCategory(null)}
            className="font-inter text-[16px] text-[#0378ED] hover:underline"
          >
            View all
          </button>
        </div>

        {filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-inter text-[20px] text-[#7A7A7A]">
              No deals found matching your search.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
              className="mt-4 font-inter text-[16px] text-[#0378ED] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onGetNow={handleGetDeal} />
            ))}
          </div>
        )}
      </section>

      {/* Referral Programs section */}
      <section className="mt-20 bg-[#0378ED] text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 font-roboto text-[40px] font-medium leading-tight md:text-[72px]">
              Referral Programs
            </h2>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                  <div className="h-3 w-4 bg-[#0378ED]" />
                </div>
                <p className="font-roboto text-[24px] leading-[60px]">
                  Extensive components library
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                  <div className="h-3 w-4 bg-[#0378ED]" />
                </div>
                <p className="font-roboto text-[24px] leading-[60px]">
                  Over 30 customizable screens
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                  <div className="h-3 w-4 bg-[#0378ED]" />
                </div>
                <p className="font-roboto text-[24px] leading-[60px]">
                  Complete flows for referral codes and links.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <button className="relative inline-flex items-center justify-center rounded-[20px] border-2 border-[#0378ED] bg-white px-10 py-3 font-roboto text-xl font-bold text-[#0378ED] md:text-2xl">
                <span className="absolute inset-0 rounded-[20px] border border-[#0378ED]" />
                Invite a friend
              </button>
            </div>
          </div>

          {/* Right side illustration placeholder */}
          <div className="flex items-center justify-center">
            <div className="flex h-[320px] w-full max-w-[640px] items-center justify-center rounded-2xl border border-white/30 bg-white/10">
              <span className="font-roboto text-lg text-white/70">
                Referral program illustration / chart placeholder
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 mt-4 flex items-center justify-end">
            <button className="font-roboto text-[24px] font-bold underline">
              Know more &gt;&gt;
            </button>
          </div>
        </div>
      </section>

      {/* Top Merchant Partners heading */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-inter text-[24px]">Our Top Merchant Partners</h2>
          <button className="font-inter text-[16px] text-[#0378ED]">
            View all
          </button>
        </div>
        {/* TODO: add merchant partner grid/carousel here */}
      </section>

      {/* Footer */}
      <footer className="mt-16 bg-[#0378ED] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-10 h-[2px] w-full bg-white" />

          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div className="font-['Shantell Sans'] text-[40px] font-bold leading-10">
              Polokaz
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6" />
                  <p className="font-['DM Sans'] text-[14px] leading-[22px]">
                    ABC Company, 123 East, 17th Street, St. louis 10001
                  </p>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-28">
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6" />
                    <div className="h-[18px] w-[18px] rounded-full bg-white" />
                    <p className="font-['Assistant'] text-[14px]">
                      (123) 456-7890
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6" />
                    <p className="font-['Assistant'] text-[14px]">
                      (123) 456-7890
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <span className="font-['DM Sans'] text-[14px] font-medium opacity-50">
                  Social Media
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  {/* Replace these placeholders with actual icons */}
                  <div className="h-6 w-6" />
                  <div className="h-[18px] w-[18px] rounded-full bg-white" />
                  <div className="h-6 w-6" />
                  <div className="h-[18px] w-[18px] rounded bg-white" />
                  <div className="h-6 w-6" />
                  <div className="h-6 w-6" />
                  <div className="h-6 w-6" />
                  <div className="h-6 w-6" />
                  <div className="h-6 w-6" />
                  <div className="h-[18px] w-[18px] rounded-full bg-white" />
                  <div className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <div className="h-px w-full bg-white/20" />
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-6 font-['DM Sans'] text-[14px] font-medium uppercase">
                <button>About us</button>
                <button>Contact us</button>
                <button>Help</button>
                <button>Privacy Policy</button>
                <button>Disclaimer</button>
              </div>
              <p className="font-['Assistant'] text-[14px] opacity-50">
                Copyright © 2022 • ABC Company.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
