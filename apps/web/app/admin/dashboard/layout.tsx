import { redirect } from "next/navigation";

export default async function Layout() {
  redirect("/admin");
}
