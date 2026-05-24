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
        style={{ background: "#00d4ff12", color: "#0a93b5", border: "1px solid #00d4ff25" }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Waze_logo.svg/32px-Waze_logo.svg.png"
          alt="Waze"
          width={size === "sm" ? 12 : 14}
          height={size === "sm" ? 12 : 14}
        />
        Waze
      </button>
      <button
        onClick={openGoogleMaps}
        className={`touch-scale flex-1 flex items-center justify-center gap-1 ${py} rounded-lg ${text} font-semibold`}
        style={{ background: "#ea433512", color: "#c53929", border: "1px solid #ea433325" }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/32px-Google_Maps_icon_%282020%29.svg.png"
          alt="Maps"
          width={size === "sm" ? 12 : 14}
          height={size === "sm" ? 12 : 14}
        />
        Maps
      </button>
    </div>
  );
}
