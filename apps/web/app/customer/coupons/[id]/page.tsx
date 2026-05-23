import { authClient } from "@polokaz/auth/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CustomerCouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!data?.session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  redirect(`/deals/${id}`);
}
