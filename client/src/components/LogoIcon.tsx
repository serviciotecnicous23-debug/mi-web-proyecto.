/**
 * Reusable logo icon component — uses the transparent PNG logo  
 * instead of the generic Lucide Flame icon.
 * Cache-busting query param ensures browsers always load the latest version.
 */
const LOGO_VERSION = "v4";

export function LogoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src={`/icons/icon-192.png?${LOGO_VERSION}`}
      alt=""
      className={className}
      aria-hidden="true"
      draggable={false}
    />
  );
}
