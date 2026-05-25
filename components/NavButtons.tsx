"use client";

import type { Provider } from "@/lib/mockData";

type Props = {
  provider: Provider;
  size?: "sm" | "md";
};

export default function NavButtons({ provider, size = "md" }: Props) {
  const openWaze = () => {
    window.open(`https://waze.com/ul?ll=${provider.lat},${provider.lng}&navigate=yes&zoom=17`, "_blank");
  };

  const openGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${provider.lat},${provider.lng}&destination_place_id=${encodeURIComponent(provider.address)}`,
      "_blank"
    );
  };

  const py = size === "sm" ? "py-1.5" : "py-2";
  const text = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className="flex gap-1.5">
      <button
        onClick={openWaze}
        className={`touch-scale flex-1 flex items-center justify-center gap-1 ${py} rounded-lg ${text} font-semibold`}
        style={{ background: "#E8F8FB", color: "#0a93b5", border: "1px solid #B2EBF4" }}
      >
        <svg width={size === "sm" ? 12 : 14} height={size === "sm" ? 12 : 14} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C7.03 2 3 6.26 3 11.5c0 2.7 1.08 5.14 2.82 6.9l-.7 3.1 3.2-.85C9.5 21.5 10.72 22 12 22c4.97 0 9-4.26 9-9.5S16.97 2 12 2z" fill="#1EC9E3"/>
          <ellipse cx="9.5" cy="11" rx="1.2" ry="1.2" fill="white"/>
          <ellipse cx="14.5" cy="11" rx="1.2" ry="1.2" fill="white"/>
          <path d="M9.5 14q2.5 1.8 5 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
        </svg>
        Waze
      </button>
      <button
        onClick={openGoogleMaps}
        className={`touch-scale flex-1 flex items-center justify-center gap-1 ${py} rounded-lg ${text} font-semibold`}
        style={{ background: "#FEF0EE", color: "#c53929", border: "1px solid #FECACA" }}
      >
        <svg width={size === "sm" ? 11 : 13} height={size === "sm" ? 13 : 15} viewBox="0 0 16 20" fill="none">
          <path d="M8 0C4.13 0 1 3.13 1 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
          <path d="M8 0C4.13 0 1 3.13 1 7c0 1.5.47 2.9 1.26 4.05L8 0z" fill="#4285F4"/>
          <path d="M1.26 11.05C2.6 13.07 5.13 16.39 8 20c0 0-2.9-3.7-4.74-6.46L1.26 11.05z" fill="#FBBC05"/>
          <circle cx="8" cy="7" r="2.5" fill="white"/>
        </svg>
        Maps
      </button>
    </div>
  );
}
