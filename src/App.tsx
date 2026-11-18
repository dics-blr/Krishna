import { useCallback, useEffect, useState } from 'react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminLayout } from './components/AdminLayout';
import { ArchitectureView } from './components/ArchitectureView';
import { FormsRegistryView } from './components/FormsRegistryView';
import { InvitationManagerView } from './components/InvitationManagerView';
import { EmployeeOnboardingPortal } from './components/onboarding/EmployeeOnboardingPortal';
import { type CreateInvitationInput, onboardingRepository } from './lib/supabase/repository';
import type {
  AdminNavSection,
  HRFormDefinition,
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
  const [readiness, setReadiness] = useState<SupabaseReadinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [readinessInfo, formsList, invitationsList] = await Promise.all([
        onboardingRepository.getReadiness(),
        onboardingRepository.listForms(),
        onboardingRepository.listInvitations(),
      ]);
      setReadiness(readinessInfo);
      setForms(formsList);
      setInvitations(invitationsList);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load portal configuration.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseLocationRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateAdminSection = (section: AdminNavSection) => {
    const targetPath = sectionToPath(section);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setRoute({ kind: 'admin', section });
  };

  const navigateOnboardingToken = (token: string) => {
    const targetPath = `/onboard/${encodeURIComponent(token)}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setRoute({ kind: 'onboard', token });
  };

  const handleCreateInvitation = async (input: CreateInvitationInput) => {
    const created = await onboardingRepository.createInvitation(input);
    setInvitations((prev) => [created, ...prev]);
  };

  if (route.kind === 'onboard') {
    return (
      <EmployeeOnboardingPortal
        token={route.token}
        onReturnToAdmin={() => navigateAdminSection('overview')}
      />
    );
  }

  const sampleToken = invitations[0]?.token ?? 'dics-stage1-preview';

  return (
    <AdminLayout
      activeSection={route.section}
      onSelectSection={navigateAdminSection}
      onOpenSampleOnboarding={() => navigateOnboardingToken(sampleToken)}
    >
      {loadError && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={loadAdminData}
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
          readiness={readiness}
          loading={loading}
          onNavigateSection={navigateAdminSection}
          onOpenOnboardingLink={navigateOnboardingToken}
        />
      )}

      {route.section === 'invitations' && (
        <InvitationManagerView
          invitations={invitations}
          loading={loading}
          onCreateInvitation={handleCreateInvitation}
          onOpenOnboardingLink={navigateOnboardingToken}
        />
      )}

      {route.section === 'forms' && (
        <FormsRegistryView
          forms={forms}
          onOpenSampleOnboarding={() => navigateOnboardingToken(sampleToken)}
        />
      )}

      {route.section === 'architecture' && <ArchitectureView readiness={readiness} />}
    </AdminLayout>
  );
}
