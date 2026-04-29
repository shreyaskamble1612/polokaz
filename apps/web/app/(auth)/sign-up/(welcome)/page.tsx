"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import ReferralIdLink from "@/components/referral-id-link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export default function LoginPage() {
  return (
    <>
      <div className="z-20 max-w-7xl md:px-0 px-4">
        <div className="mb-10 flex justify-center">
          <BrandLogo size="xl" priority />
        </div>
        <motion.h1
          className="tracking-tighter text-white text-6xl text-center font-medium md:text-9xl"
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
          key="header"
        >
          Where It All Connects
        </motion.h1>

        <section className="md:mt-8 md:mb-12 my-8 text-lg md:text-3xl font-light space-y-1 w-full grid place-content-center text-center">
          <motion.p
            key="paragraph-1"
            className="tracking-tighter text-white"
            initial={{
              opacity: 0,
            }}
            exit={{
              opacity: 1,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{ type: "spring", delay: 0.5 }}
          >
            Exclusive access for members & invitees only
          </motion.p>

          <motion.p
            className="tracking-tighter text-white"
            initial={{
              opacity: 0,
            }}
            exit={{
              opacity: 1,
            }}
            animate={{
              opacity: 1,
            }}
            key="paragraph-2"
            transition={{ type: "spring", delay: 0.75 }}
          >
            You don’t find Polokaz, you join it!
          </motion.p>
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
          transition={{ type: "spring", delay: 1 }}
          key="cta"
        >
          <Button
            className="text-base mx-auto text-white font-medium rounded-full cursor-pointer"
            size="lg"
          >
            <ReferralIdLink href="/sign-up/about">
              Access your invitation
            </ReferralIdLink>
          </Button>
        </motion.div>
      </div>
    </>
  );
}
