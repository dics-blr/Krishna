import React, { useState } from 'react';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';
import { getSupabaseBrowserClient } from '../lib/supabase/browserClient';
import { onboardingRepository } from '../lib/supabase/repository';
import type { HrUserProfile } from '../shared/types';
import { LogoPlaceholder } from './LogoPlaceholder';

interface HrLoginViewProps {
  onAuthenticated: (hrUser: HrUserProfile) => void;
}

export const HrLoginView: React.FC<HrLoginViewProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Enter your DICS Global HR Admin email address and password.');
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setError('Supabase browser client is not configured.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError || !data.session) {
        throw new Error(signInError?.message || 'Invalid HR Admin credentials.');
      }

      const hrUser = await onboardingRepository.getCurrentHrUser();
      if (!hrUser) {
        await client.auth.signOut();
        throw new Error(
          'Your account signed in, but is not registered as an active DICS HR Admin in public.hr_admin_users.'
        );
      }

      onAuthenticated(hrUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-10">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex justify-center">
          <LogoPlaceholder />
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1.5 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#1D4ED8]">
              <Lock className="w-3.5 h-3.5" />
              <span>Supabase Auth · Protected HR Workspace</span>
            </div>
            <h1 className="text-xl font-semibold text-[#0B1F3A]">
              HR Admin Sign In
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in with your authorized DICS Global HR Admin credentials to issue onboarding
              invitations, inspect candidate packets, and verify Office Use sections.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="hr-login-email" className="block text-xs font-medium text-slate-700">
                Work Email Address
              </label>
              <input
                id="hr-login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hr@dicsglobal.com"
                className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="hr-login-password" className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                id="hr-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-[#0B1F3A] hover:bg-[#132D52] disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? 'Verifying HR Session...' : 'Sign In to HR Dashboard'}</span>
            </button>
          </form>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 flex items-start gap-2.5 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
            <span>
              Employees do not register or sign in here — candidates access their onboarding forms
              directly via their unique <span className="font-mono">/onboard/:token</span> invitation
              link.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
