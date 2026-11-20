import { useCallback, useEffect, useState } from 'react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminLayout } from './components/AdminLayout';
import { EmployeeSubmissionsView } from './components/EmployeeSubmissionsView';
import { FormsRegistryView } from './components/FormsRegistryView';
import { HrLoginView } from './components/HrLoginView';
import { HrVerificationView } from './components/HrVerificationView';
import { InvitationManagerView } from './components/InvitationManagerView';
import { SubmissionDetailModal } from './components/SubmissionDetailModal';
import { EmployeeOnboardingPortal } from './components/onboarding/EmployeeOnboardingPortal';
import { getSupabaseBrowserClient } from './lib/supabase/browserClient';
import { type CreateInvitationInput, onboardingRepository } from './lib/supabase/repository';
import { getEffectiveInvitationStatus } from './shared/onboardingLogic';
import type {
  AdminNavSection,
  HRFormDefinition,
  HrSubmissionSummary,
  HrUserProfile,
  OnboardingInvitation,
  SupabaseReadinessInfo,
} from './shared/types';

type RouteState =
  | { kind: 'admin'; section: AdminNavSection }
  | { kind: 'onboard'; token: string };

function parseLocationRoute(): RouteState {
  const pathname = window.location.pathname;
  const onboardMatch = pathname.match(/^\/onboard\/([^/]+)\/?$/);
  if (onboardMatch) {
    return { kind: 'onboard', token: decodeURIComponent(onboardMatch[1]) };
  }
  if (pathname === '/invitations') {
    return { kind: 'admin', section: 'invitations' };
  }
  if (pathname === '/submissions') {
    return { kind: 'admin', section: 'submissions' };
  }
  if (pathname === '/verification') {
    return { kind: 'admin', section: 'verification' };
  }
  if (pathname === '/forms') {
    return { kind: 'admin', section: 'forms' };
  }
  return { kind: 'admin', section: 'overview' };
}

function sectionToPath(section: AdminNavSection): string {
  switch (section) {
    case 'invitations':
      return '/invitations';
    case 'submissions':
      return '/submissions';
    case 'verification':
      return '/verification';
    case 'forms':
      return '/forms';
    case 'overview':
    default:
      return '/';
  }
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => parseLocationRoute());
  const [forms, setForms] = useState<HRFormDefinition[]>([]);
  const [invitations, setInvitations] = useState<OnboardingInvitation[]>([]);
  const [submissions, setSubmissions] = useState<HrSubmissionSummary[]>([]);
  const [readiness, setReadiness] = useState<SupabaseReadinessInfo | null>(null);
  const [hrUser, setHrUser] = useState<HrUserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invitationNotice, setInvitationNotice] = useState<string | null>(null);
  const [inspectingInvitationId, setInspectingInvitationId] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const readinessInfo = await onboardingRepository.getReadiness();
      setReadiness(readinessInfo);

      const resolvedUser = await onboardingRepository.getCurrentHrUser();
      setHrUser(resolvedUser);
      setAuthChecked(true);

      if (!resolvedUser) {
        const formsList = await onboardingRepository.listForms();
        setForms(formsList);
        setInvitations([]);
        setSubmissions([]);
        return;
      }

      const [formsList, invitationsList, submissionsList] = await Promise.all([
        onboardingRepository.listForms(),
        onboardingRepository.listInvitations(),
        onboardingRepository.listSubmissions(),
      ]);
      setForms(formsList);
      setInvitations(invitationsList);
      setSubmissions(submissionsList);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load portal configuration.'
      );
      setAuthChecked(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data: subscription } = client.auth.onAuthStateChange(() => {
      void loadAdminData();
    });
    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [loadAdminData, readiness?.configured]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseLocationRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateAdminSection = (section: AdminNavSection) => {
    if (section !== 'invitations') {
      setInvitationNotice(null);
    }
    const targetPath = sectionToPath(section);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setRoute({ kind: 'admin', section });
    void loadAdminData();
  };

  const navigateOnboardingToken = (token: string) => {
    const targetPath = `/onboard/${encodeURIComponent(token)}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setRoute({ kind: 'onboard', token });
  };

  const handleCreateInvitation = async (
    input: CreateInvitationInput
  ): Promise<OnboardingInvitation> => {
    const created = await onboardingRepository.createInvitation(input);
    setInvitations((prev) => [created, ...prev]);
    setInvitationNotice(null);
    const updatedSubs = await onboardingRepository.listSubmissions();
    setSubmissions(updatedSubs);
    return created;
  };

  const handleExpireInvitation = async (id: string): Promise<OnboardingInvitation> => {
    const updated = await onboardingRepository.expireInvitation(id);
    setInvitations((prev) =>
      prev.map((inv) => (inv.id === updated.id ? updated : inv))
    );
    const updatedSubs = await onboardingRepository.listSubmissions();
    setSubmissions(updatedSubs);
    return updated;
  };

  const handleSignOut = async () => {
    const client = getSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
    }
    setHrUser(null);
    setInvitations([]);
    setSubmissions([]);
  };

  const handleOpenEmployeePreview = () => {
    const activeInvite = invitations.find(
      (inv) =>
        getEffectiveInvitationStatus(inv) === 'active' &&
        Boolean(inv.token && inv.invitePath)
    );
    if (activeInvite) {
      navigateOnboardingToken(activeInvite.token);
      return;
    }
    setInvitationNotice(
      'Create an employee invitation link below to preview the employee onboarding experience.'
    );
    navigateAdminSection('invitations');
  };

  // Registration-free employee onboarding link works without HR Admin login
  if (route.kind === 'onboard') {
    return (
      <EmployeeOnboardingPortal
        token={route.token}
        showAdminReturn={Boolean(hrUser)}
        onReturnToAdmin={() => navigateAdminSection('overview')}
      />
    );
  }

  // Wait for session check before deciding between HR Login and HR Dashboard
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-7 text-center space-y-4 shadow-xs">
          <img
            src="/assets/dics-logo.png"
            alt="DICS Global"
            className="h-10 w-auto mx-auto object-contain"
          />
          <div className="space-y-1">
            <div className="h-1.5 w-36 bg-slate-200 rounded-full overflow-hidden mx-auto">
              <div className="h-full w-1/2 bg-[#EA580C] rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-slate-500">Loading DICS Global HR Portal...</p>
          </div>
        </div>
      </div>
    );
  }

  // Fail-closed: always require an authenticated HR user before rendering HR Admin views
  if (!hrUser) {
    return (
      <HrLoginView
        serviceUnavailable={readiness ? !readiness.configured : false}
        onAuthenticated={(user) => {
          setHrUser(user);
          void loadAdminData();
        }}
      />
    );
  }

  return (
    <AdminLayout
      activeSection={route.section}
      onSelectSection={navigateAdminSection}
      onOpenSampleOnboarding={handleOpenEmployeePreview}
      hrUser={hrUser}
      readiness={readiness}
      onSignOut={handleSignOut}
    >
      {loadError && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void loadAdminData()}
            className="text-xs font-medium underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {route.section === 'overview' && (
        <AdminDashboardView
          forms={forms}
          invitations={invitations}
          submissions={submissions}
          readiness={readiness}
          loading={loading}
          onNavigateSection={navigateAdminSection}
          onOpenOnboardingLink={navigateOnboardingToken}
          onInspectSubmission={(id) => setInspectingInvitationId(id)}
        />
      )}

      {route.section === 'invitations' && (
        <InvitationManagerView
          invitations={invitations}
          loading={loading}
          guidanceNotice={invitationNotice}
          onDismissGuidanceNotice={() => setInvitationNotice(null)}
          onCreateInvitation={handleCreateInvitation}
          onExpireInvitation={handleExpireInvitation}
          onOpenOnboardingLink={navigateOnboardingToken}
        />
      )}

      {route.section === 'submissions' && (
        <EmployeeSubmissionsView
          submissions={submissions}
          loading={loading}
          onInspectSubmission={(id) => setInspectingInvitationId(id)}
          onNavigateSection={navigateAdminSection}
        />
      )}

      {route.section === 'verification' && (
        <HrVerificationView
          submissions={submissions}
          loading={loading}
          onInspectSubmission={(id) => setInspectingInvitationId(id)}
        />
      )}

      {route.section === 'forms' && (
        <FormsRegistryView
          forms={forms}
          onOpenSampleOnboarding={handleOpenEmployeePreview}
        />
      )}

      <SubmissionDetailModal
        invitationId={inspectingInvitationId}
        hrUser={hrUser}
        authEnforced={Boolean(readiness?.authEnforced)}
        onClose={() => setInspectingInvitationId(null)}
        onUpdated={loadAdminData}
      />
    </AdminLayout>
  );
}
