'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Sign Up Page
 * Allows new users to create an account with email/password
 * Users will need administrator approval before accessing the app
 */
export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      // Check for errors in the response
      if (result.error) {
        setError(result.error.message || 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      // After successful signup, user will be redirected to pending-approval
      // by the dashboard layout (since they're not approved yet)
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center font-[var(--font-display)]">
            Join Chorus
          </CardTitle>
          <CardDescription className="text-center">
            Create an account - administrator approval required
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[var(--color-charcoal)]">
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[var(--color-charcoal)]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[var(--color-charcoal)]">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-[var(--color-charcoal)]/60">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-[var(--color-charcoal)]"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-[var(--color-charcoal)]/70">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                className="text-[var(--color-terracotta)] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>

            <p className="text-center text-xs text-[var(--color-charcoal)]/60 mt-2 p-3 bg-[var(--color-sage)]/10 rounded-[var(--radius-md)]">
              ⚠️ Note: New accounts require administrator approval before you can access the app
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
