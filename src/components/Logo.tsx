import { brand } from '@/lib/brand';

interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="folioGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M22 14h14l12 12v22a3 3 0 0 1-3 3H22a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z"
        stroke="url(#folioGrad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M36 14v9a3 3 0 0 0 3 3h9"
        stroke="url(#folioGrad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M25 37h12M25 44h8" stroke="url(#folioGrad)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="44" r="9" fill="#0f172a" />
      <path
        d="M40.5 44.5l2.5 2.5 4.5-5"
        stroke="url(#folioGrad)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Logo({
  variant = 'full',
  className = '',
  markClassName = 'h-9 w-9',
  textClassName = 'text-xl font-display font-extrabold',
}: LogoProps) {
  if (variant === 'mark') {
    return <LogoMark className={markClassName} />;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span className={`font-display tracking-tight text-navy-900 ${textClassName}`}>
        Folio<span className="text-brand-gradient">Up</span>
      </span>
    </div>
  );
}

export { brand };
