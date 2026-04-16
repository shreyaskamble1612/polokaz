import { Session } from "@polokaz/auth";
import Link from "next/link";
import { NavUser } from "./nav-user";

function HomeHeader({ session }: { session: Session }) {
  return (
    <header className="px-6 py-4 border-b-border bg-background justify-between flex items-center">
      <h1 className="text-xl font-semibold tracking-tighter">
        <Link href="/">Polokaz</Link>
      </h1>

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
