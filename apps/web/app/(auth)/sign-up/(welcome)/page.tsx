"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag, Store, Sparkles } from "lucide-react";
import { motion } from "motion/react";

const paths = [
  {
    title: "Merchant",
    description: "I sell products",
    href: "/sign-up/merchant",
    icon: Store,
    note: "Merchant setup",
  },
  {
    title: "Consumer",
    description: "I buy products",
    href: "/sign-up/onboarding",
    icon: ShoppingBag,
  },
];

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_20%),linear-gradient(180deg,#0b1018_0%,#07080d_48%,#040507_100%)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_80%_24%,rgba(245,158,11,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_30%)]" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-12 mix-blend-screen" />
      <div className="absolute inset-0 bg-black/65" />

      <Link
        href="/sign-in"
        className="absolute left-4 top-4 z-20 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/5 text-white/90 backdrop-blur-xl transition hover:border-white/35 hover:bg-white/10"
        aria-label="Back to sign in"
      >
        <ArrowUpRight className="size-5 -rotate-45" />
      </Link>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/75 backdrop-blur-xl">
            <Sparkles className="size-3.5 text-amber-200" />
            Choose your path
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Who are you today?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            Pick the experience that matches how you use Polokaz and continue to the right onboarding flow.
          </p>
        </motion.div>

        <div className="mt-10 grid w-full gap-6 md:max-w-4xl md:grid-cols-2 md:gap-10">
          {paths.map((path, index) => {
            const Icon = path.icon;
            const cardContent = (
              <>
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/12 text-white ring-1 ring-white/10 transition group-hover:bg-white/16">
                  <Icon className="size-12" strokeWidth={1.7} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-white">
                    {path.title}
                  </div>
                  <div className="mt-2 text-sm text-white/65">
                    {path.description}
                  </div>
                  {path.note ? (
                    <div className="mt-3 inline-flex rounded-full border border-amber-200/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
                      {path.note}
                    </div>
                  ) : null}
                </div>
              </>
            );

            return (
              <motion.div
                key={path.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 * (index + 1) }}
              >
                {path.href ? (
                  <Button asChild className="h-auto w-full rounded-[28px] border border-white/18 bg-white/8 p-0 text-left shadow-[0_20px_70px_rgba(0,0,0,0.36)] transition hover:-translate-y-1 hover:bg-white/12">
                    <Link href={path.href} className="group flex min-h-60 flex-1 flex-col items-center justify-center gap-4 px-6 py-8 sm:px-8">
                      {cardContent}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled
                    className="h-auto w-full cursor-not-allowed rounded-[28px] border border-white/18 bg-white/5 p-0 text-left opacity-80 shadow-[0_20px_70px_rgba(0,0,0,0.28)]"
                  >
                    <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-4 px-6 py-8 sm:px-8">
                      {cardContent}
                    </div>
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
