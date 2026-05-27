import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { LeagueLogo } from "@/components/league-logo";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const session = verifySessionToken(token);

  if (session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex justify-center">
          <LeagueLogo size="md" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Commissioner Access</p>
        <h1 className="mt-2 text-2xl font-bold">Sign in to League Hub</h1>
        <p className="mt-2 text-sm text-slate-300">
          This workspace is private to Webs and co-commissioner operations.
        </p>

        <form action={loginAction} className="mt-5 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Username</span>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </label>
          {params.error ? <p className="text-xs text-rose-300">Invalid username or password.</p> : null}
          <button
            type="submit"
            className="w-full rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}
