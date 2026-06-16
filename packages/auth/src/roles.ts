export type AppRole = "super_admin" | "admin" | "merchant" | "member";

type MaybeRole = Record<string, unknown> | null | undefined;

function readRole(user?: MaybeRole) {
  if (!user || typeof user !== "object" || !("role" in user)) {
    return null;
  }

  const { role } = user as { role?: unknown };
  return typeof role === "string" ? role : null;
}

function readTier(user?: MaybeRole) {
  if (!user || typeof user !== "object" || !("tier" in user)) {
    return null;
  }

  const { tier } = user as { tier?: unknown };
  return typeof tier === "string" ? tier : null;
}

export function getUserRole(user?: MaybeRole | null): AppRole {
  const role = readRole(user);
  const tier = readTier(user);

  if (role === "super_admin") {
    return "super_admin";
  }

  if (role === "admin") {
    return "admin";
  }

  if (role === "merchant" || tier === "merchant") {
    return "merchant";
  }

  return "member";
}


export function isAdminRole(user?: MaybeRole | null) {
  const role = getUserRole(user);
  return role === "admin" || role === "super_admin";
}

export function isMerchantRole(user?: MaybeRole | null) {
  return getUserRole(user) === "merchant";
}

export function getRoleHomePath(user?: MaybeRole | null) {
  const role = getUserRole(user);

  if (role === "admin" || role === "super_admin") {
    return "/admin";
  }

  if (role === "merchant") {
    return "/merchant";
  }

  return "/customer/dashboard";
}

