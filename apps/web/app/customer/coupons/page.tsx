"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Deal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  discountValue: string | null;
  merchantName: string;
  startDate: string | null;
  endDate: string | null;
  thumbnailUrl: string | null;
  images: string[] | null;
}

type CouponDisplay = {
  id: string;
  category: string;
  code: string;
  title: string;
  description: string;
  liveDate: string;
  endDate: string;
  location: string;
  merchant: string;
  imageUrl?: string;
};

const FALLBACK_COUPONS: CouponDisplay[] = Array.from({ length: 6 }).map((_, i) => ({
  id: String(i),
  category: "Food & Drink",
  code: "C2100B - Active",
  title: "20% Off On Overall Bill",
  description:
    "Enjoy a flat 20% discount on all food and beverage orders at select locations. No minimum bill required.",
  liveDate: "2025-11-20",
  endDate: "2025-11-20",
  location: "Las Vegas, Nevada",
  merchant: "Abc Merchant",
  imageUrl: "https://placehold.co/214x218",
}));
//partial data to show something while real data is loading. Can be removed once API is integrated and stable
function mapDealToCoupon(d: Deal): CouponDisplay {
  return {
    id: d.id,
    category: d.category ?? "Deal",
    code: `${d.id.slice(-6).toUpperCase()} - Active`,
    title: d.title,
    description: d.description ?? "No minimum bill required.",
    liveDate: d.startDate ? d.startDate.slice(0, 10) : "—",
    endDate: d.endDate ? d.endDate.slice(0, 10) : "—",
    location: "Las Vegas, Nevada",
    merchant: d.merchantName,
    imageUrl: d.thumbnailUrl ?? d.images?.[0] ?? "https://placehold.co/214x218",
  };
}

export default function Page() {
  const [coupons, setCoupons] = useState<typeof FALLBACK_COUPONS>(FALLBACK_COUPONS);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ couponsCount: 12, vouchersCount: 16, earnings: "$16" });

  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch(`${API_URL}/api/deals?limit=20`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const deals: Deal[] = data.deals ?? [];
        if (deals.length > 0) {
          setCoupons(deals.map(mapDealToCoupon));
          setStats((s) => ({ ...s, couponsCount: data.pagination?.total ?? deals.length }));
        }
      } catch {
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Top Nav */}
      <header className="w-full border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <img
              src="https://placehold.co/169x55"
              alt="Polokaz logo"
              className="h-12 w-auto"
            />
          </div>

          <nav className="hidden items-center gap-20 text-[20px] font-inter md:flex">
            <a className="font-light text-black" href="#">
              Home
            </a>
            <a className="font-light text-black" href="#">
              Coupons
            </a>
            <a className="font-light text-black" href="#">
              Events
            </a>
            <a className="font-medium text-[#0378ED]" href="#">
              Dashboard
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <img
              src="https://placehold.co/62x62"
              alt="User avatar"
              className="h-14 w-14 rounded-lg border border-gray-300 object-cover"
            />
            <div className="hidden text-[24px] font-inter sm:block">
              Pratik Vankore
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-8 pb-16">
        {/* Stats row */}
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Coupons / Vouchers */}
          <div className="flex-1 rounded-xl border border-[#A9D4FF] bg-[#FBFDFF] px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-end gap-4">
                <span className="font-inter text-[48px] font-light text-[#494949]">
                  {stats.couponsCount}
                </span>
                <span className="pb-1 font-inter text-[24px] font-light text-[#494949]">
                  Coupons
                </span>
              </div>
              <div className="h-[130px] w-px bg-[#A9D4FF]" />
              <div className="flex items-end gap-4">
                <span className="font-inter text-[48px] font-light text-[#494949]">
                  {stats.vouchersCount}
                </span>
                <span className="pb-1 font-inter text-[24px] font-light text-[#494949]">
                  Vouchers
                </span>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="flex-1 rounded-xl border border-[#A9D4FF] bg-[#FBFDFF] px-8 py-6">
            <div className="flex items-center justify-center gap-3">
              <span className="font-inter text-[24px] font-light text-[#494949]">
                My Earnings,
              </span>
              <span className="font-inter text-[48px] font-light text-[#494949]">
                {stats.earnings}
              </span>
              <span className="font-inter text-[24px] font-light text-[#494949]">
                Till now
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-8 px-2 font-inter text-[24px]">
            <button className="border-b-4 border-[#0378ED] pb-3 font-medium text-[#0378ED]">
              My Coupons
            </button>
            <button className="pb-3 font-light text-black">My Vouchers</button>
          </div>
          <div className="h-px w-full bg-[#E5E5E5]" />
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row">
          {/* Search */}
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-[#E3E3E3] bg-white px-4 py-2">
            <div className="h-6 w-6 rounded-md bg-[#ABABAB]" />
            <span className="font-inter text-[20px] text-[#ABABAB]">
              Search here
            </span>
          </div>

          {/* Location */}
          <div className="flex w-full items-center gap-3 rounded-xl border border-[#E3E3E3] bg-white px-4 py-2 lg:w-[324px]">
            <span className="font-inter text-[20px] text-[#ABABAB]">
              Select location
            </span>
            <div className="ml-auto h-[5px] w-[10px] rounded-sm bg-[#5F6368]" />
          </div>

          {/* Categories */}
          <div className="flex w-full items-center gap-3 rounded-xl border border-[#E3E3E3] bg-white px-4 py-2 lg:w-[324px]">
            <span className="font-inter text-[20px] text-[#ABABAB]">
              Select Categories
            </span>
            <div className="ml-auto h-[5px] w-[10px] rounded-sm bg-[#5F6368]" />
          </div>
        </div>

        {/* Coupons grid */}
        <div className="mt-12 flex flex-wrap justify-center gap-8">
          {loading && coupons.length === 0 ? (
            <div className="w-full py-12 text-center font-inter text-[#7A7A7A]">
              Loading deals…
            </div>
          ) : (
          coupons.map((coupon) => (
            <article
              key={coupon.id}
              className="flex w-full max-w-[560px] overflow-hidden rounded-lg border border-[#0378ED] bg-white"
            >
              {/* Left image/overlay */}
              <div className="relative w-[214px] shrink-0">
                <img
                  src={coupon.imageUrl ?? "https://placehold.co/214x218"}
                  alt={coupon.category}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[#0378ED]/25 backdrop-blur-sm" />
                <div className="absolute left-1 top-1 inline-flex items-center rounded-tl-md rounded-br-sm bg-[#0378ED] px-3 py-1">
                  <span className="font-inter text-[12px] text-white">
                    {coupon.category}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="https://placehold.co/125x125"
                    alt="Merchant"
                    className="h-[125px] w-[125px] rounded-full border border-[#959595] shadow"
                  />
                </div>
              </div>

              {/* Right content */}
              <div className="flex flex-1 flex-col p-4 pr-5">
                <div className="mb-2 flex items-start justify-between">
                  <div className="font-inter text-[12px] text-[#7A7A7A]">
                    {coupon.code}
                  </div>
                  <div className="inline-flex h-6 items-center justify-center rounded-tr-md rounded-bl-sm bg-[#0378ED] px-4">
                    <span className="font-inter text-[12px] text-white">
                      {coupon.merchant}
                    </span>
                  </div>
                </div>
                <h3 className="mb-2 font-inter text-[24px] font-semibold leading-6 text-[#2E2E2E]">
                  {coupon.title}
                </h3>
                <p className="mb-4 font-inter text-[12px] text-[#7A7A7A]">
                  {coupon.description}
                </p>

                <div className="mb-4 grid grid-cols-2 gap-y-2 font-inter text-[12px] text-[#7A7A7A]">
                  <div>
                    <div>Live Date</div>
                    <div>{coupon.liveDate}</div>
                  </div>
                  <div>
                    <div>End Date</div>
                    <div>{coupon.endDate}</div>
                  </div>
                  <div>
                    <div>Location</div>
                    <div className="leading-3 text-[#4F4E4E]">
                      {coupon.location}
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-end">
                  <button className="inline-flex items-center justify-center rounded-lg border border-[#0378ED] px-5 py-1.5 font-inter text-[12px] font-semibold text-[#0378ED]">
                    Get Now
                  </button>
                </div>
              </div>
            </article>
          )))}
        </div>

        {/* Load more */}
        <div className="mt-12 flex justify-center">
          <button className="flex h-14 w-full max-w-[820px] items-center justify-center rounded-xl border border-[#3193F5] bg-[#C4E1FF] font-inter text-[16px] font-semibold text-[#0378ED]">
            Load More
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0378ED] text-white">
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

