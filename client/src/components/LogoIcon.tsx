/**
 * LogoIcon — delegates to the animated FlameLogoSVG isotipo.
 * Drop-in replacement: accepts the same `className` prop as before.
 */
import { FlameLogoSVG } from './FlameLogoSVG';

export function LogoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return <FlameLogoSVG className={className} animate />;
}
