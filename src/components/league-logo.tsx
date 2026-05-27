import Image from "next/image";

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
        src="/logo-dos-navy.png"
        alt="D.O.S. Dynasty of Slingers"
        width={dims.width}
        height={dims.height}
        priority={priority || size === "lg"}
        className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
      />
      {showLabel ? (
        <p className={`uppercase tracking-[0.25em] text-amber-300/90 ${dims.text}`}>Legacy League</p>
      ) : null}
    </div>
  );
}
