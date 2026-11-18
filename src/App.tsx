import { useCallback, useEffect, useState } from 'react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminLayout } from './components/AdminLayout';
import { ArchitectureView } from './components/ArchitectureView';
import { FormsRegistryView } from './components/FormsRegistryView';
import { HrLoginView } from './components/HrLoginView';
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
  if (pathname === '/forms') {
    return { kind: 'admin', section: 'forms' };
  }
  if (pathname === '/architecture') {
    return { kind: 'admin', section: 'architecture' };
  }
  return { kind: 'admin', section: 'overview' };
}

function sectionToPath(section: AdminNavSection): string {
  switch (section) {
    case 'invitations':
      return '/invitations';
    case 'forms':
      return '/forms';
    case 'architecture':
      return '/architecture';
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

      let resolvedUser: HrUserProfile | null = null;
      if (readinessInfo.authEnforced) {
        resolvedUser = await onboardingRepository.getCurrentHrUser();
        setHrUser(resolvedUser);
        setAuthChecked(true);

        if (!resolvedUser) {
          const formsList = await onboardingRepository.listForms();
          setForms(formsList);
          setInvitations([]);
          setSubmissions([]);
          return;
        }
      } else {
        setHrUser(null);
        setAuthChecked(true);
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
  }, [loadAdminData]);

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
      'No active invitation link with a one-time token is present in this browser session. Create a new invitation link below to open the employee onboarding portal.'
    );
    navigateAdminSection('invitations');
  };

  // Registration-free employee onboarding link works without HR Admin login
  if (route.kind === 'onboard') {
    return (
      <EmployeeOnboardingPortal
        token={route.token}
        onReturnToAdmin={() => navigateAdminSection('overview')}
      />
    );
  }

  // Enforce HR Admin login when Supabase credentials & auth are active
  if (authChecked && readiness?.authEnforced && !hrUser) {
    return (
      <HrLoginView
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

      {route.section === 'forms' && (
        <FormsRegistryView
          forms={forms}
          onOpenSampleOnboarding={handleOpenEmployeePreview}
        />
      )}

      {route.section === 'architecture' && <ArchitectureView readiness={readiness} />}

      <SubmissionDetailModal
        invitationId={inspectingInvitationId}
        onClose={() => setInspectingInvitationId(null)}
        onUpdated={loadAdminData}
      />
    </AdminLayout>
  );
}
