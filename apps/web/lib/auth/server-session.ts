import { authClient } from "@polokaz/auth/client";
import { getRoleHomePath, getUserRole } from "@polokaz/auth/roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type ServerSessionData = Awaited<ReturnType<typeof getServerSession>>;

export async function getServerSession() {
  const { data } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  return data ?? null;
}

export async function requireServerSession() {
  const session = await getServerSession();

  if (!session?.session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireRole(role: "admin" | "merchant" | "member") {
  const session = await requireServerSession();
  const sessionRole = getUserRole(session.user);

  if (sessionRole !== role) {
    redirect(getRoleHomePath(session.user));
  }

  return session;
}

export function getSessionHomePath(session: ServerSessionData) {
  return getRoleHomePath(session?.user);
}
