import { redirect } from "next/navigation";
import { getSessionHomePath, requireServerSession } from "@/lib/auth/server-session";

export default async function Page() {
  const session = await requireServerSession();
  redirect(getSessionHomePath(session));
}
