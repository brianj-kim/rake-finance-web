'use client';

import { useRouter } from 'next/navigation';
import { PowerIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

type Props = {
  className?: string;
  label?: string;
  showIcon?: boolean;
  onSignedOut?: () => void;
};

const DEFAULT_CLASS =
  "flex h-12 w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 disabled:opacity-60 md:flex-none md:p-2 md:px-3";

const SignOutButton = ({ 
  className,
  label = 'Sign Out',
  showIcon = true,
  onSignedOut,
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
      setLoading(false);
      router.replace('/login?next=%2F');
    }
  };

  return (
    <button 
      type='button'
      onClick={onSignOut}
      disabled={loading}
      className={`${DEFAULT_CLASS} ${className ?? ""}`}
    >
      {showIcon && <PowerIcon className="w-6" />}
      <span className="hidden md:block">
        {loading ? "Signing out..." : label}
      </span>
    </button>
  )
}

export default SignOutButton;