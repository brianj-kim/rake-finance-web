'use client';

import { useRouter } from 'next/navigation';
import { PowerIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

type Props = {
  className?: string;
};

const SignOutButton = ({ className }: Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      className={
        className ??
        'flex h-12 w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 disabled:opacity-60 md:flex-none md:justify-start md:p-2 md:px-3'
      }
    >
      <PowerIcon className='w-6' />
      <div className='hidden md:block'>{loading ? 'Signing out...' : 'Sign Out'}</div>
    </button>
  )
}

export default SignOutButton;