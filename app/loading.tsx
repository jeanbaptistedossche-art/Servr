export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div
        className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
        style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }}
      />
      <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
        Laden...
      </p>
    </div>
  );
}
