import webpush from "web-push";
import { requireFounderApi } from "@/lib/os/requireFounderApi";

export async function GET() {
  const deny = await requireFounderApi();
  if (deny) return deny;

  const keys = webpush.generateVAPIDKeys();
  return Response.json(keys);
}
