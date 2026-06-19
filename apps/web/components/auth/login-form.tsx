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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@polokaz/auth/client";
import { getRoleHomePath } from "@polokaz/auth/roles";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Spinner } from "../ui/spinner";

const loginSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    const { error, data } = await authClient.signIn.email({ ...values });

    if (error) {
      setError("root", {
        message: error.message || "Unknown error, try again later",
      });

      return;
    }

    if (data.user) {
      router.refresh();
      router.push(getRoleHomePath(data.user));
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-start gap-1 text-start">
          <h1 className="text-2xl font-semibold tracking-tighter">
            Welcome Back 👋
          </h1>
          <p className="text-muted-foreground text-base tracking-tighter">
            Today is a new day. It&apos;s your day. You shape it. Sign in to
            start Shopping
          </p>
        </div>
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
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input id="password" type="password" {...register("password")} />
          <FieldError errors={[errors.password]} />
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
            {isSubmitting ? <Spinner /> : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
