import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const username = await getSession();
  if (!username) {
    redirect("/login");
  }
  return <>{children}</>;
}
