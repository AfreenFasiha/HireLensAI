import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  GitPullRequest,
  Calendar,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/candidates', label: 'Candidates', icon: Users },
    { to: '/pipeline', label: 'Pipeline', icon: GitPullRequest },
    { to: '/interviews', label: 'Interviews', icon: Calendar },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ...(hasRole(['ADMIN']) ? [{ to: '/admin', label: 'Admin', icon: ShieldAlert }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#000000] border-r border-white/10 flex flex-col h-screen select-none transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header (72px desktop) */}
        <div className="h-[72px] px-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-wider text-white text-sm uppercase">HireLens AI</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                {user?.organization_name || 'Enterprise'}
              </span>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="p-1 rounded-md text-neutral-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-mono tracking-widest uppercase text-neutral-500">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onMobileClose && onMobileClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white border-l-2 border-white pl-[10px] font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 opacity-80" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-white/10 mt-auto">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/10 text-white font-mono text-xs uppercase border border-white/20">
                {user?.full_name ? user.full_name[0] : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
                <p className="text-[10px] text-neutral-400 capitalize font-mono">{user?.role?.toLowerCase().replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
