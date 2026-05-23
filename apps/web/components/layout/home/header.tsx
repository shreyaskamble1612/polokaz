import type { Session } from "@polokaz/auth";
import { getRoleHomePath } from "@polokaz/auth/roles";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NavUser } from "./nav-user";

function HomeHeader({ session }: { session: Session }) {
  return (
    <header className="px-6 py-4 border-b-border bg-background justify-between flex items-center">
      <BrandLogo href={getRoleHomePath(session.user)} size="md" priority />

      <NavUser
        user={{
          email: session.user.email,
          name: session.user.name,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
    </header>
  );
}

export { HomeHeader };
