import { auth } from "@polokaz/auth/server";
import { getRoleHomePath, getUserRole } from "@polokaz/auth/roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type ServerSessionData = Awaited<ReturnType<typeof getServerSession>>;

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
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

  const hasAccess =
    sessionRole === role ||
    (role === "admin" && sessionRole === "super_admin");

  if (!hasAccess) {
    redirect(getRoleHomePath(session.user));
  }

  return session;
}


export function getSessionHomePath(session: ServerSessionData) {
  return getRoleHomePath(session?.user);
}
