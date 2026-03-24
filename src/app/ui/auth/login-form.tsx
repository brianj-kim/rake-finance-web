'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  next: string;
};

type ApiOK = { ok: true; error?: string };
type ApiFail = { ok?: false; error?: string };

const safeNext = (v: string) => {
  if (!v || typeof v !== 'string') return '/income';
  if (!v.startsWith('/')) return '/income';
  if (v.startsWith('//')) return '/income';

  return v;
}

const LoginForm = ({ next }: Props) => {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const redirectTo = React.useMemo(() => safeNext(next), [next]);

  const onSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, next: redirectTo }),
      });

      const data = (await res.json().catch(() => ({}))) as ApiOK | ApiFail;

      if (!res.ok) {
        setError(data?.error ?? 'Login failed');
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel w-full max-w-sm p-6 sm:p-7">
      <div className="mb-6">
        <div className="page-eyebrow">Secure Access</div>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Admin Sign In</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use your admin account to access modules.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@yourchurch.ca"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 rounded-xl border bg-muted px-4 py-3 text-xs text-muted-foreground">
        Redirect after login: <span className="font-medium text-foreground">{redirectTo}</span>
      </div>
    </div>
  );
}

export default LoginForm;
