import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CommissionerHub } from "@/components/commissioner-hub";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell username={session.username} role={session.role}>
      <CommissionerHub />
    </AppShell>
  );
}
