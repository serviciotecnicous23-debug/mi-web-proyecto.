/**
 * Reusable logo icon component — uses the transparent PNG logo  
 * instead of the generic Lucide Flame icon.
 */
export function LogoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/icon-192.png"
      alt=""
      className={className}
      aria-hidden="true"
      draggable={false}
    />
  );
}
