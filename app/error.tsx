"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 px-6 text-center">
      <span className="text-6xl">⚠️</span>
      <div>
        <h1 className="text-2xl font-black mb-2">Er ging iets mis</h1>
        <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
          De pagina kon niet laden.
        </p>
        <p className="text-xs px-4 py-2 rounded-xl mt-2 font-mono break-all"
          style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
          {error.message}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="touch-scale px-5 py-3 rounded-2xl font-bold text-white text-sm"
          style={{ background: "var(--teal)" }}>
          Opnieuw proberen
        </button>
        <Link href="/onboarding"
          className="touch-scale px-5 py-3 rounded-2xl font-bold text-sm border"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Terug naar login
        </Link>
      </div>
    </div>
  );
}
