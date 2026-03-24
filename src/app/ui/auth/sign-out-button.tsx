'use client';

import { useRouter } from 'next/navigation';
import { PowerIcon } from '@heroicons/react/24/outline';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  label?: string;
  showIcon?: boolean;
  onSignedOut?: () => void;
  variant?: 'default' | 'plain';
  iconOnly?: boolean;
};

const DEFAULT_CLASS =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium text-foreground disabled:opacity-60";
const PLAIN_CLASS =
  "inline-flex h-auto w-auto items-center gap-2 px-0 py-0 text-sm font-medium text-slate-500 disabled:opacity-60";
const ICON_ONLY_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-60";

const SignOutButton = ({ 
  className,
  label = 'Sign Out',
  showIcon = true,
  onSignedOut,
  variant = 'default',
  iconOnly = false,
}: Props) => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const onSignOut = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
    } finally {
      onSignedOut?.();
      setLoading(false);
      router.replace('/login?next=%2F');
    }
  };

  return (
    <button 
      type='button'
      onClick={onSignOut}
      disabled={loading}
      aria-label={loading ? 'Signing out' : label}
      className={cn(
        iconOnly ? ICON_ONLY_CLASS : variant === 'plain' ? PLAIN_CLASS : DEFAULT_CLASS,
        className
      )}
    >
      {showIcon && <PowerIcon className="w-5" />}
      {iconOnly ? (
        <span className="sr-only">{loading ? "Signing out..." : label}</span>
      ) : (
        <span>{loading ? "Signing out..." : label}</span>
      )}
    </button>
  )
}

export default SignOutButton;
