import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  variant?: "landing" | "shell";
  onClick?: () => void;
};

export function BrandLogo({ href = "/", className = "", variant = "landing", onClick }: BrandLogoProps) {
  const textClass =
    variant === "landing"
      ? "text-[18px] font-black tracking-tight text-[#142d61] sm:text-[20px]"
      : "text-lg font-black tracking-tight text-[#142d61] sm:text-xl";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-w-fit shrink-0 items-center gap-2 whitespace-nowrap ${className}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#142d61] text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M3 10 12 4l9 6-9 6-9-6Zm2.5 2.8L12 17l6.5-4.2V16L12 20l-6.5-4v-3.2Z" />
        </svg>
      </div>
      <span className={textClass}>쌤버십</span>
    </Link>
  );
}
