import React, { useState } from 'react';
import {
  Building2,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
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
  { id: 'overview', label: 'HR Overview', icon: LayoutDashboard },
  { id: 'invitations', label: 'Invitations', icon: Link2 },
  { id: 'forms', label: 'Nine HR Forms', icon: FileSpreadsheet },
  { id: 'architecture', label: 'Supabase Blueprint', icon: Database },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeSection,
  onSelectSection,
  onOpenSampleOnboarding,
  hrUser,
  readiness,
  onSignOut,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLabel =
    NAV_ITEMS.find((item) => item.id === activeSection)?.label ?? 'HR Overview';

  const statusText = readiness?.configured
    ? 'Supabase Connected · Auth Enforced'
    : 'Development Fallback · Stage 1 In-Memory';

  const handleNavClick = (section: AdminNavSection) => {
    onSelectSection(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-slate-50/70">
        <div className="h-16 px-5 border-b border-slate-200 flex items-center bg-white">
          <LogoPlaceholder />
        </div>

        <nav aria-label="HR Admin Navigation" className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white'
                    : 'text-slate-700 hover:bg-slate-200/70 hover:text-[#0B1F3A]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-slate-800 truncate">
                {hrUser ? hrUser.fullName : 'Bengaluru Headquarters'}
              </p>
              <p className="text-slate-500 truncate">
                {hrUser
                  ? hrUser.email
                  : readiness?.configured
                    ? 'Supabase Active'
                    : 'Fallback Preview Mode'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSampleOnboarding}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-[#1D4ED8] text-xs font-medium text-[#1D4ED8] bg-white hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            <span>Open Employee Link Preview</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </button>
          {hrUser && onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-4">
        <LogoPlaceholder compact />
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="inline-flex items-center justify-center w-11 h-11 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSampleOnboarding();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-md border border-[#1D4ED8] text-sm font-medium text-[#1D4ED8] bg-white"
            >
              <span>Open Employee Link Preview</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            {hrUser && onSignOut && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-md border border-slate-300 text-sm font-medium text-slate-700 bg-white"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({hrUser.email})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <div className="hidden lg:flex h-16 px-8 border-b border-slate-200 items-center justify-between gap-8 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
            <span className="font-medium text-[#0B1F3A] whitespace-nowrap">
              DICS – Employee Onboarding Portal
            </span>
            <span aria-hidden="true">/</span>
            <span className="truncate">{activeLabel}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {statusText}
            </span>
            <button
              type="button"
              onClick={() => onSelectSection('invitations')}
              className="px-4 py-2 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              Manage Invitations
            </button>
          </div>
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
