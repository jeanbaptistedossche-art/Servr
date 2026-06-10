import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Call at the top of every /api/os route handler.
 * Returns a 401 Response if the caller is not the founder.
 * Returns null if the caller IS the founder (proceed normally).
 */
export async function requireFounderApi(): Promise<Response | null> {
  try {
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
      return new Response("Unauthorized", { status: 401 });
    }
    return null;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
