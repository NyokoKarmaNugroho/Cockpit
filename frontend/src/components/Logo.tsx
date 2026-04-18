type LogoProps = { className?: string; variant?: "default" | "onDark" };

export function Logo({ className = "", variant = "default" }: LogoProps) {
  const stroke = variant === "onDark" ? "stroke-white" : "stroke-ink";
  const fill = variant === "onDark" ? "fill-white" : "fill-ink";
  const cross = variant === "onDark" ? "stroke-white/40" : "stroke-ink/40";
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="20" cy="20" r="12" className={stroke} strokeWidth="1.5" fill="none" />
      <circle cx="20" cy="20" r="4" className={fill} />
      <path
        d="M20 8v4M20 28v4M8 20h4M28 20h4"
        className={cross}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
