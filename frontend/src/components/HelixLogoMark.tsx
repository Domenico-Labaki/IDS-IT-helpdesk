type HelixLogoMarkProps = {
  className?: string;
};

/** HELIX's ripple mark, matching the README banner. */
export function HelixLogoMark({ className = "" }: HelixLogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`helix-gradient relative inline-block shrink-0 overflow-hidden rounded-[24%] shadow-[0_10px_28px_rgba(23,105,255,0.28),inset_0_1px_rgba(255,255,255,0.25)] ${className}`}
    >
      <span className="absolute inset-[14%] rounded-full border-[1.5px] border-white/90" />
      <span className="absolute left-1/2 top-1/2 size-[23%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.72)]" />
      <span className="absolute left-[67%] top-[20%] size-[10%] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.68)]" />
    </span>
  );
}
