import { requireFounder } from "@/lib/os/requireFounder";

export default async function OSLayout({ children }: { children: React.ReactNode }) {
  await requireFounder();
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000007", overflow: "hidden", zIndex: 9999 }}>
      {children}
    </div>
  );
}
