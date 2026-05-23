"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import ReferralIdLink from "@/components/referral-id-link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Suspense } from "react";

const faq = [
  "Invite‑only lifestyle platform for exclusive deals, events, and experiences.",
  "Seamlessly connects people, places, and moments in one private ecosystem.",
  "Access curated coupons and rewards directly through your personalized dashboard.",
  "Enjoy free deals, member‑only vouchers, and perks based on your subscription tier.",
  "Earn rewards and referral bonuses by inviting friends to join.",
  "Discover authentic local experiences managed by trusted merchants and organizations.",
];

export default function LoginPage() {
  return (
    <>
      <div className="z-20 max-w-screen px-6 md:px-0 md:max-w-4xl w-full flex flex-col items-start">
        <div className="mb-8 w-full">
          <BrandLogo size="lg" priority />
        </div>
        <motion.h1
          className="tracking-tighter text-white text-4xl text-left font-medium md:text-6xl"
          initial={{
            opacity: 0,
          }}
          exit={{
            opacity: 1,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{ type: "spring", delay: 0.25 }}
          key="about-header"
        >
          What is polokaz
        </motion.h1>

        <section className="md:mt-12 md:mb-12 my-8 text-base md:text-2xl font-light space-y-4 w-full grid place-content-center">
          {faq.map((q, index) => (
            <motion.li
              key={q}
              className="tracking-tighter text-white md:ml-0 ml-4"
              initial={{
                opacity: 0,
              }}
              exit={{
                opacity: 1,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{ type: "spring", delay: (index + 2) * 0.25 }}
            >
              {q}
            </motion.li>
          ))}
        </section>

        <motion.div
          className="w-full grid place-content-center"
          initial={{
            opacity: 0,
          }}
          exit={{
            opacity: 1,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{ type: "spring", delay: (faq.length + 1.5) * 0.25 }}
          key="about-cta"
        >
          <Button
            className="text-base mx-auto text-white font-medium rounded-full cursor-pointer"
            size="lg"
          >
            <Suspense fallback={<span>Get started</span>}>
              <ReferralIdLink href="/sign-up">
                Get started
              </ReferralIdLink>
            </Suspense>
          </Button>
        </motion.div>
      </div>
    </>
  );
}

