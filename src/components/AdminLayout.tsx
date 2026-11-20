import React, { useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import type { AdminNavSection, HrUserProfile, SupabaseReadinessInfo } from '../shared/types';
import { LogoPlaceholder } from './LogoPlaceholder';

interface AdminLayoutProps {
  activeSection: AdminNavSection;
  onSelectSection: (section: AdminNavSection) => void;
  onOpenSampleOnboarding: () => void;
  hrUser?: HrUserProfile | null;
  readiness?: SupabaseReadinessInfo | null;
  onSignOut?: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: AdminNavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invitations', label: 'Employee Invitations', icon: UserPlus },
  { id: 'submissions', label: 'Employee Submissions', icon: FileText },
  { id: 'verification', label: 'HR Verification', icon: ShieldCheck },
  { id: 'forms', label: 'HR Forms', icon: ClipboardCheck },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeSection,
  onSelectSection,
  onOpenSampleOnboarding,
  hrUser,
  onSignOut,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLabel =
    NAV_ITEMS.find((item) => item.id === activeSection)?.label ?? 'Dashboard';

  const handleNavClick = (section: AdminNavSection) => {
    onSelectSection(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Deep Navy Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0B1F3A] text-white border-r border-[#132D52]">
        <div className="px-5 py-4 border-b border-white/10">
          <LogoPlaceholder variant="on-dark" />
        </div>

        <div className="px-4 pt-5 pb-2">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            HR Administration
          </p>
        </div>

        <nav aria-label="HR Admin Navigation" className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left whitespace-nowrap ${
                  isActive
                    ? 'bg-[#C2410C] text-white shadow-xs'
                    : 'text-slate-200 hover:bg-[#132D52] hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3 bg-[#08172B]">
          <div className="flex items-start gap-2.5 text-xs">
            <div className="w-8 h-8 rounded-lg bg-[#132D52] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[#FDBA74]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">
                {hrUser ? hrUser.fullName : 'DICS Global HR'}
              </p>
              <p className="text-slate-300 truncate text-[11px]">
                {hrUser ? hrUser.email : 'Bengaluru Headquarters'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSampleOnboarding}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/20 text-xs font-medium text-white bg-white/5 hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            <span>Open Employee Portal</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </button>

          {hrUser && onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between gap-4">
        <LogoPlaceholder compact />
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-[#0B1F3A] hover:bg-slate-50"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B1F3A] text-white px-4 py-4 space-y-1.5 border-b border-[#132D52]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#C2410C] text-white'
                    : 'text-slate-200 hover:bg-[#132D52]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3 mt-2 border-t border-white/10 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSampleOnboarding();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-white/20 text-sm font-medium text-white bg-white/5"
            >
              <span>Open Employee Portal</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            {hrUser && onSignOut && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-white/15 text-sm font-medium text-slate-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-68 flex flex-col min-w-0">
        <div className="hidden lg:flex h-16 px-8 border-b border-slate-200 items-center justify-between gap-6 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
            <span className="font-semibold text-[#0B1F3A] whitespace-nowrap">
              DICS Global HR Portal
            </span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-700 font-medium truncate">{activeLabel}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSelectSection('invitations')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Invitation</span>
            </button>
          </div>
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
