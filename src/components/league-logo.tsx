import Image from "next/image";
import { LOGO_ASSET } from "@/lib/brand-assets";

type LeagueLogoProps = {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  priority?: boolean;
};

const sizeMap = {
  xs: { width: 72, height: 48, text: "text-[10px]" },
  sm: { width: 112, height: 75, text: "text-[10px]" },
  md: { width: 168, height: 112, text: "text-xs" },
  lg: { width: 240, height: 160, text: "text-sm" },
};

export function LeagueLogo({
  size = "md",
  showLabel = false,
  className = "",
  priority = false,
}: LeagueLogoProps) {
  const dims = sizeMap[size];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Image
        src={LOGO_ASSET}
        alt="SoD Slinger's of Dynasty"
        width={dims.width}
        height={dims.height}
        priority={priority || size === "lg"}
        className="drop-shadow-[0_4px_18px_rgba(255,111,225,0.35)]"
      />
      {showLabel ? (
        <p className={`uppercase tracking-[0.25em] text-amber-300/90 ${dims.text}`}>Legacy League</p>
      ) : null}
    </div>
  );
}
