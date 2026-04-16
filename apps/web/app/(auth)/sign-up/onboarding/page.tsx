import { SignUpForm } from "@/components/auth/sign-up-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex items-center justify-between p-4 gap-12 w-screen h-screen">
      <div className="flex flex-col gap-4 p-4 md:p-10 flex-1">
        <div className="flex items-center justify-center">
          <div className="md:w-md w-full">
            <SignUpForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden w-2xl h-full my-auto lg:block rounded-3xl">
        <Image
          src="/sign-up/onboarding-customer.jpg"
          fill
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale rounded-3xl"
        />
      </div>
    </div>
  );
}
