import { Session } from "@polokaz/auth";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NavUser } from "./nav-user";

function HomeHeader({ session }: { session: Session }) {
  return (
    <header className="px-6 py-4 border-b-border bg-background justify-between flex items-center">
      <BrandLogo href="/" size="md" priority />

      <NavUser
        user={{
          email: session.user.email,
          name: session.user.name,
          avatar: session.user.image,
        }}
      />
    </header>
  );
}

export { HomeHeader };
