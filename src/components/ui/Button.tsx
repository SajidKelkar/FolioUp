import { Link } from 'react-router-dom';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-glow hover:shadow-lg hover:scale-[1.02]',
  secondary:
    'bg-white text-navy-800 border border-navy-200 hover:border-navy-300 hover:bg-navy-50',
  ghost: 'text-navy-600 hover:text-navy-900 hover:bg-navy-50',
  danger: 'bg-error-500 text-white hover:bg-error-600',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

type ButtonProps = Omit<
  BaseProps,
  'children'
> & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps extends BaseProps {
  to: string;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  to,
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: 'brand' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export function Badge({ children, color = 'brand', className = '' }: BadgeProps) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
    neutral: 'bg-navy-100 text-navy-600',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}
