import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Call at the top of every /os server component (layout or page).
 * Silently redirects to / if the request is not from the founder.
 */
export async function requireFounder() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const founderEmail = process.env.FOUNDER_EMAIL;

  if (!session || !founderEmail || session.user.email !== founderEmail) {
    redirect("/");
  }
}
