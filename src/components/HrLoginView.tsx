import React, { useState } from 'react';
import { Building2, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react';
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
      setError('Please enter your DICS Global HR Admin email address and password.');
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setError('Sign-in service is currently unavailable. Please contact your system administrator.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError || !data.session) {
        throw new Error(signInError?.message || 'Invalid HR Admin email or password.');
      }

      const hrUser = await onboardingRepository.getCurrentHrUser();
      if (!hrUser) {
        await client.auth.signOut();
        throw new Error(
          'Your account does not have HR Administrator access. Please contact DICS Global HR.'
        );
      }

      onAuthenticated(hrUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Brand Panel (Desktop) */}
      <aside className="hidden lg:flex lg:w-[44%] xl:w-[42%] bg-[#0B1F3A] text-white p-12 flex-col justify-between">
        <div className="space-y-8">
          <LogoPlaceholder variant="on-dark" />

          <div className="space-y-4 pt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FDBA74]">
              Human Resources Administration
            </p>
            <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight text-white">
              Employee Onboarding Portal
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Digital Instruments &amp; Control Systems (DICS Global) centralized HR portal for
              issuing joining invitations, reviewing employee onboarding forms, and verifying
              joining records.
            </p>
          </div>
        </div>

        <div className="border-t border-white/15 pt-6 space-y-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-[#EA580C] shrink-0" />
            <span>#B-261, 6th Main, 2nd Stage, Peenya Industrial Estate, Bengaluru – 560058</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-[#EA580C] shrink-0" />
            <span>bangalore@dicsglobal.com</span>
          </div>
        </div>
      </aside>

      {/* Right Sign-In Form */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-10">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="flex justify-center lg:hidden">
            <LogoPlaceholder variant="hero" />
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1.5 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#C2410C]">
                <Lock className="w-3.5 h-3.5" />
                <span>Authorized HR Portal</span>
              </div>
              <h2 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
                HR Admin Login
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sign in with your DICS Global HR Administrator account to manage employee
                invitations, submissions, and verification.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="hr-login-email" className="block text-xs font-semibold text-slate-700">
                  Work Email Address
                </label>
                <input
                  id="hr-login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@dicsglobal.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="hr-login-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <input
                  id="hr-login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>{submitting ? 'Signing In...' : 'Sign In to HR Portal'}</span>
              </button>
            </form>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5" />
              <span>
                Joining employees do not log in here. Please use your personal Invitation Link sent
                directly by the DICS Global HR team.
              </span>
            </div>
          </section>

          <p className="text-center text-xs text-slate-500 lg:hidden">
            Digital Instruments &amp; Control Systems · Bengaluru, India
          </p>
        </div>
      </main>
    </div>
  );
};
