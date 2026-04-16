"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@polokaz/auth/client";
import { AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "../ui/spinner";
import { DateOfBirthPicker } from "../ui/date-of-birth-picker";
import { CountryDropdown } from "../ui/country-dropdown";

const loginSchema = z
  .object({
    name: z.string().min(1, { message: "A name is required" }),
    email: z.email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    dateOfBirth: z.date({ message: "A date of birth is required" }),
    country: z.string().min(1, { message: "Please select a country" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      country: "",
    } as Partial<z.infer<typeof loginSchema>>,
  });

  const router = useRouter();

  const searchParams = useSearchParams();
  const referralId = searchParams.get("referralId");
  const trackdeskClickId = searchParams.get("tdclid"); // Trackdesk click ID

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (!referralId) {
      setError("root", { message: "There is no referral code" });

      return;
    }

    const { error, data } = await authClient.signUp.email({
      referralId,
      trackdeskClickId: trackdeskClickId || undefined,
      countryName: values.country,
      birthdate: values.dateOfBirth,
      ...values,
    });

    if (error) {
      setError("root", {
        message: error.message || "Unknown error, try again later",
      });

      return;
    }

    if (data.user) {
      // If user signed up with a Trackdesk click ID, report the conversion
      if (trackdeskClickId) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/trackdesk/report-conversion`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include", // Include session cookie
            },
          );
        } catch (error) {
          // Log error but don't block user flow
          console.error("Failed to report conversion to Trackdesk:", error);
        }
      }

      router.push("/");
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-start gap-1 text-left">
          <h1 className="text-2xl font-semibold tracking-tighter">
            Get started
          </h1>
          <p className="text-muted-foreground text-base text-balance tracking-tighter">
            Sign up to get started
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Full name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John doe"
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <div>
              <DateOfBirthPicker
                value={field.value}
                onChange={field.onChange}
              />
              <FieldError errors={[errors.dateOfBirth]} />
            </div>
          )}
        />

        <Field className="w-full">
          <FieldLabel htmlFor="country">Country</FieldLabel>
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <CountryDropdown
                placeholder="Select country"
                defaultValue={field.value}
                onChange={(country) => {
                  field.onChange(country.alpha3);
                }}
              />
            )}
          />
          <FieldError errors={[errors.country]} />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input id="password" type="password" {...register("password")} />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          </div>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        {errors.root && (
          <div className="bg-destructive/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="text-destructive size-4" />
            <span className="text-destructive tracking-tighter text-sm">
              {errors.root.message}
            </span>
          </div>
        )}
        <Field>
          <Button
            className="tracking-tighter"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner /> : "Create account"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
