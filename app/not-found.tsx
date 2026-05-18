import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6 animate-bounce-in text-center">
      <span className="text-7xl">🔧</span>
      <div>
        <h1 className="text-2xl font-black mb-2">Pagina niet gevonden</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Deze vakman is even niet beschikbaar.
        </p>
      </div>
      <Link
        href="/"
        className="touch-scale px-6 py-3 rounded-2xl font-bold text-white text-sm"
        style={{ background: "var(--teal)" }}
      >
        ← Terug naar home
      </Link>
    </div>
  );
}
