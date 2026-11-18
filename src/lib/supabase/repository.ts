import type {
  HRFormDefinition,
  OnboardingInvitation,
  OnboardingSessionState,
  SupabaseReadinessInfo,
} from '../../shared/types';

export interface CreateInvitationInput {
  referenceLabel: string;
  department: string;
  targetRole: string;
  expiryDays: number;
}

export interface PreviewSubmitReceipt {
  receiptCode: string;
  submittedAt: string;
  mode: 'stage1_preview';
  message: string;
}

export interface OnboardingRepository {
  getReadiness(): Promise<SupabaseReadinessInfo>;
  listForms(): Promise<HRFormDefinition[]>;
  listInvitations(): Promise<OnboardingInvitation[]>;
  createInvitation(input: CreateInvitationInput): Promise<OnboardingInvitation>;
  getInvitationByToken(token: string): Promise<OnboardingInvitation>;
  submitPreviewOnboarding(
    token: string,
    session: OnboardingSessionState
  ): Promise<PreviewSubmitReceipt>;
}

/**
 * Stage 1 Backend-Backed Preview Repository.
 * Communicates with the Express server in-memory Stage 1 endpoints without using SQLite or localStorage.
 * Designed to be swapped with a SupabaseRepository in Stage 2 without modifying UI components.
 */
export class Stage1ApiRepository implements OnboardingRepository {
  async getReadiness(): Promise<SupabaseReadinessInfo> {
    const res = await fetch('/api/health');
    if (!res.ok) {
      throw new Error('Failed to load portal readiness status.');
    }
    const data = (await res.json()) as { supabase: SupabaseReadinessInfo };
    return data.supabase;
  }

  async listForms(): Promise<HRFormDefinition[]> {
    const res = await fetch('/api/forms');
    if (!res.ok) {
      throw new Error('Failed to load HR form registry.');
    }
    const data = (await res.json()) as { forms: HRFormDefinition[] };
    return data.forms;
  }

  async listInvitations(): Promise<OnboardingInvitation[]> {
    const res = await fetch('/api/invitations');
    if (!res.ok) {
      throw new Error('Failed to load onboarding invitations.');
    }
    const data = (await res.json()) as { invitations: OnboardingInvitation[] };
    return data.invitations;
  }

  async createInvitation(input: CreateInvitationInput): Promise<OnboardingInvitation> {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { invitation?: OnboardingInvitation; error?: string };
    if (!res.ok || !data.invitation) {
      throw new Error(data.error || 'Could not create preview invitation link.');
    }
    return data.invitation;
  }

  async getInvitationByToken(token: string): Promise<OnboardingInvitation> {
    const res = await fetch(`/api/onboarding/${encodeURIComponent(token)}`);
    const data = (await res.json()) as { invitation?: OnboardingInvitation; error?: string };
    if (!res.ok || !data.invitation) {
      throw new Error(data.error || 'Invitation link is invalid or unavailable.');
    }
    return data.invitation;
  }

  async submitPreviewOnboarding(
    token: string,
    session: OnboardingSessionState
  ): Promise<PreviewSubmitReceipt> {
    const res = await fetch(`/api/onboarding/${encodeURIComponent(token)}/preview-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    });
    const data = (await res.json()) as { receipt?: PreviewSubmitReceipt; error?: string };
    if (!res.ok || !data.receipt) {
      throw new Error(data.error || 'Preview submission validation failed.');
    }
    return data.receipt;
  }
}

export const onboardingRepository: OnboardingRepository = new Stage1ApiRepository();
