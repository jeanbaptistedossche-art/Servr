import { requireFounder } from "@/lib/os/requireFounder";
import OSShell from "./OSShell";

export default async function OSLayout({ children }: { children: React.ReactNode }) {
  await requireFounder();
  return <OSShell>{children}</OSShell>;
}
