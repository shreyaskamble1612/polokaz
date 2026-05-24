"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Store,
} from "lucide-react";

import { authClient } from "@polokaz/auth/client";
import { getRoleHomePath } from "@polokaz/auth/roles";
import { BrandLogo } from "@/components/brand/brand-logo";
import { onboardMerchant } from "@/lib/api/merchants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const businessTypes = [
  "Retail",
  "Food & Beverage",
  "Health & Wellness",
  "Beauty & Fitness",
  "Travel & Hospitality",
  "Education",
  "Automotive",
];

const memberRanges = [
  "1 - 10",
  "11 - 50",
  "51 - 200",
  "201 - 500",
  "500+",
];

const merchantSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyEmail: z.string().email("Enter a valid company email"),
  companyPhone: z.string().min(6, "Company phone is required"),
  companyAddress: z.string().min(6, "Company address is required"),
  companyWebsite: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: "Website must start with http:// or https://",
    }),
  businessType: z.string().min(1, "Choose a business type"),
  contactPersonOneName: z.string().min(2, "Contact person 1 is required"),
  contactPersonOnePhone: z.string().min(6, "Contact phone is required"),
  contactPersonTwoName: z.string().optional().or(z.literal("")),
  contactPersonTwoPhone: z.string().optional().or(z.literal("")),
  memberRange: z.string().min(1, "Choose a member range"),
  notes: z.string().optional().or(z.literal("")),
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
  dateOfBirth: z.string().min(1, "A date of birth is required"),
  countryName: z.string().min(1, "Country is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type MerchantFormValues = z.infer<typeof merchantSchema>;

type Step = 0 | 1 | 2;

const stepMeta = [
  { label: "Business Profile", description: "Tell us about your company" },
  { label: "Contact & Size", description: "Add your team and company size" },
  { label: "Account Setup", description: "Create your merchant login" },
] as const;

function ProgressPill({ index, active, done }: { index: number; active: boolean; done: boolean }) {
  return (
    <div className={cn(
      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition",
      done ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-[#0f7af7] bg-[#0f7af7] text-white" : "border-slate-200 bg-white text-slate-500",
    )}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      companyWebsite: "",
      businessType: "",
      contactPersonOneName: "",
      contactPersonOnePhone: "",
      contactPersonTwoName: "",
      contactPersonTwoPhone: "",
      memberRange: "",
      notes: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      countryName: "",
    },
  });

  useEffect(() => {
    const currentStep = Math.max(0, Math.min(step, 2));
    setStep(currentStep as Step);
  }, [step]);

  const selectedBusinessType = watch("businessType");

  const visibleCard = useMemo(() => {
    if (step === 0) {
      return {
        title: "What is Polokaz?",
        bullets: [
          "Invite-only lifestyle platform for exclusive deals, events, and experiences.",
          "Seamlessly connects people, places, and moments in one private ecosystem.",
          "Access curated coupons and rewards through your personalized dashboard.",
          "Earn referral bonuses by inviting friends to join.",
        ],
      };
    }

    if (step === 1) {
      return {
        title: "Grow your reach",
        bullets: [
          "Tell us how many members or customers you serve today.",
          "Add two contact people so your merchant setup stays organized.",
          "Use the business type to tailor your future deal feed.",
          "Every application stays tied to the signed-in account.",
        ],
      };
    }

    return {
      title: "Launch your merchant account",
      bullets: [
        "Create a secure merchant login with role-based access.",
        "Your application will be saved before we move you into the merchant area.",
        "Protected merchant pages stay behind authorization checks.",
        "You can return and sign in any time after submission.",
      ],
    };
  }, [step]);

  const nextStep = async () => {
    if (step === 0) {
      const valid = await trigger([
        "companyName",
        "companyEmail",
        "companyPhone",
        "companyAddress",
        "companyWebsite",
        "businessType",
      ] as const);
      if (valid) setStep(1);
      return;
    }

    if (step === 1) {
      const valid = await trigger([
        "contactPersonOneName",
        "contactPersonOnePhone",
        "contactPersonTwoName",
        "contactPersonTwoPhone",
        "memberRange",
        "notes",
      ] as const);
      if (valid) setStep(2);
      return;
    }
  };

  const submitMerchant = async (values: MerchantFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const signUpPayload = {
      name: values.name,
      email: values.email,
      password: values.password,
      birthdate: new Date(values.dateOfBirth),
      countryName: values.countryName,
      tier: "merchant",
    } as Record<string, unknown>;

    const { error: authError, data } = await authClient.signUp.email(signUpPayload as never);

    if (authError) {
      setError(authError.message || "Unable to create merchant account");
      setIsSubmitting(false);
      return;
    }

    if (!data.user) {
      setError("Unable to create merchant account");
      setIsSubmitting(false);
      return;
    }

    try {
      await onboardMerchant({
        businessName: values.companyName,
        businessCategory: values.businessType,
        contactEmail: values.companyEmail,
        website: values.companyWebsite || undefined,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Account created, but merchant onboarding failed. Please retry from the merchant dashboard.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push(getRoleHomePath({ role: "merchant" }));
  };

  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <BrandLogo href="/" size="lg" priority />
          <Button asChild variant="ghost" className="rounded-full text-slate-700 hover:bg-slate-100">
            <Link href="/sign-in">Contact us</Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-[0.96fr_1.04fr]">
          <section className="bg-white px-5 py-8 text-slate-950 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                <Store className="h-3.5 w-3.5" />
                Merchant onboarding
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Get Started!</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Build your merchant profile in a few steps and launch into Polokaz.</p>
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {stepMeta.map((item, index) => (
                <div key={item.label} className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
                  step === index ? "border-[#0f7af7] bg-[#eff6ff]" : step > index ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
                )}>
                  <ProgressPill index={index} active={step === index} done={step > index} />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(submitMerchant)}>
              {step === 0 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="companyName">Organisation&apos;s Name</Label>
                    <Input id="companyName" placeholder="Eg: xyz.pvt.ltd" {...register("companyName")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.companyName?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Email id</Label>
                    <Input id="companyEmail" placeholder="Example@email.com" {...register("companyEmail")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.companyEmail?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="companyPhone">Phone no.</Label>
                    <Input id="companyPhone" placeholder="eg: +15363456784" {...register("companyPhone")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.companyPhone?.message}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input id="companyWebsite" placeholder="Eg: www.xyz.com" {...register("companyWebsite")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.companyWebsite?.message}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Input id="companyAddress" placeholder="Enter Address here" {...register("companyAddress")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.companyAddress?.message}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Type of Business</Label>
                    <Select onValueChange={(value) => setValue("businessType", value)} value={watch("businessType")}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-rose-600">{errors.businessType?.message}</p>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contactPersonOneName">Contact person 1</Label>
                    <Input id="contactPersonOneName" placeholder="Enter Name" {...register("contactPersonOneName")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.contactPersonOneName?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="contactPersonOnePhone">Phone no.</Label>
                    <Input id="contactPersonOnePhone" placeholder="Enter Phone no." {...register("contactPersonOnePhone")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.contactPersonOnePhone?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="contactPersonTwoName">Contact person 2</Label>
                    <Input id="contactPersonTwoName" placeholder="Enter Name" {...register("contactPersonTwoName")} />
                  </div>
                  <div>
                    <Label htmlFor="contactPersonTwoPhone">Phone no.</Label>
                    <Input id="contactPersonTwoPhone" placeholder="Enter Phone no." {...register("contactPersonTwoPhone")} />
                  </div>
                  <div>
                    <Label>Organisation Type</Label>
                    <Select onValueChange={(value) => setValue("businessType", value)} value={selectedBusinessType}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Choose a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>No. of members in organisation</Label>
                    <Select onValueChange={(value) => setValue("memberRange", value)} value={watch("memberRange")}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Choose a range" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberRanges.map((range) => (
                          <SelectItem key={range} value={range}>{range}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-rose-600">{errors.memberRange?.message}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Anything else we should know?" {...register("notes")} className="min-h-24 rounded-2xl" />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="John Jacob" {...register("name")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.name?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="Example@email.com" {...register("email")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.email?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">DOB</Label>
                    <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.dateOfBirth?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="countryName">Country</Label>
                    <Input id="countryName" placeholder="New York, United States" {...register("countryName")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.countryName?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="password">Enter Password</Label>
                    <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.password?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="At least 8 characters" {...register("confirmPassword")} />
                    <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword?.message}</p>
                  </div>
                </div>
              ) : null}

              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className={cn("rounded-full border-slate-200 bg-white text-slate-700", step === 0 ? "opacity-0 pointer-events-none" : "")}
                  onClick={() => setStep((current) => Math.max(0, current - 1) as Step)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {step < 2 ? (
                  <Button type="button" onClick={nextStep} className="rounded-full bg-slate-950 px-8 text-white hover:bg-slate-800">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="rounded-full bg-slate-950 px-8 text-white hover:bg-slate-800">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join the Polokaz Family"}
                  </Button>
                )}
              </div>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              Already have an account? <Link href="/sign-in" className="font-semibold text-[#0f7af7]">Sign in</Link>
            </p>
          </section>

          <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,#08101d_0%,#0a0f18_48%,#05070b_100%)] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-20 mix-blend-screen" />
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10 flex h-full flex-col text-white">
              <div className="mb-6">
                <h2 className="text-3xl font-light tracking-tight sm:text-4xl">{visibleCard.title}</h2>
                <ul className="mt-6 space-y-4 text-sm leading-7 text-white/82 sm:text-[15px]">
                  {visibleCard.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/90" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto overflow-hidden rounded-[26px] border border-white/12 bg-black/25 shadow-[0_18px_55px_rgba(0,0,0,0.28)]">
                <div className="relative h-72">
                  <Image
                    src="https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1600&q=80"
                    alt="Polokaz city view"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(4,7,11,0.72)_100%)]" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur">
                    Watch this video for more details.
                  </div>
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-white/80 text-slate-950 shadow-[0_10px_30px_rgba(0,0,0,0.32)]">
                      <div className="ml-1 h-0 w-0 border-y-11 border-y-transparent border-l-18 border-l-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
