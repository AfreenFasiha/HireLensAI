import React, { useState } from 'react';
import {
  Lock,
  Moon,
  Sun,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword && !currentPassword) {
      setStatusMsg({ type: 'error', text: 'Current password is required to change password.' });
      return;
    }

    setIsSavingProfile(true);
    try {
      await api.auth.updateMe({
        full_name: fullName,
        password: newPassword || undefined,
        current_password: currentPassword || undefined
      });
      await refreshUser();
      setStatusMsg({ type: 'success', text: 'Profile preferences updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile settings.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Settings & Preferences"
        subtitle="Configure profile credentials, workspace appearance, and AI matching parameters."
      />

      <div className="p-6 lg:p-8 space-y-8 flex-1 max-w-[1150px] w-full mx-auto">
        {statusMsg && (
          <div
            className={`p-4 rounded-lg border text-xs flex items-center gap-2 font-mono ${
              statusMsg.type === 'success'
                ? 'bg-black/5 border-black/15 text-white'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Profile & Security Form in Air Card */}
        <div className="air-card space-y-6">
          <div className="pb-3 border-b border-black/10">
            <h3 className="text-base font-bold text-[#1b1b1b]">Personal Profile & Security</h3>
            <p className="text-xs text-neutral-500 font-mono">Manage your recruiter credentials and authentication password.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="air-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="air-input text-xs opacity-60 cursor-not-allowed bg-black/[0.04]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-black/10">
              <h4 className="text-xs font-bold text-[#1b1b1b] uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-neutral-700" />
                Change Password (Optional)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-600 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="air-input text-xs"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-600 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="air-input text-xs"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-600 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="air-input text-xs"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="bg-[#1b1b1b] text-white hover:bg-black rounded-lg px-4 py-2 font-medium text-xs disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Workspace Theme Preference */}
        <div className="air-card space-y-4">
          <div className="pb-3 border-b border-black/10">
            <h3 className="text-base font-bold text-[#1b1b1b]">Appearance & Theme</h3>
            <p className="text-xs text-neutral-500 font-mono">Select your display configuration.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`p-4 rounded-lg border text-left transition-all flex items-center justify-between ${
                theme === 'dark'
                  ? 'border-black bg-black text-white'
                  : 'border-black/15 bg-white text-[#1b1b1b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-xs font-bold font-mono uppercase">Dark Midnight Sky (Air)</p>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Deep black void with sculptural glass and haze cards
                  </p>
                </div>
              </div>
              {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-white" />}
            </button>

            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`p-4 rounded-lg border text-left transition-all flex items-center justify-between ${
                theme === 'light'
                  ? 'border-black bg-white text-[#1b1b1b] ring-1 ring-black'
                  : 'border-black/15 bg-white text-[#1b1b1b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-neutral-700" />
                <div>
                  <p className="text-xs font-bold font-mono uppercase">High-Key Daylight</p>
                  <p className="text-[10px] text-neutral-500">
                    Clean high-contrast minimal aesthetic
                  </p>
                </div>
              </div>
              {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#1b1b1b]" />}
            </button>
          </div>
        </div>

        {/* AI Matching Architecture Details */}
        <div className="air-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-black/10">
            <Sliders className="w-4 h-4 text-[#2b7fff]" />
            <h3 className="text-base font-bold text-[#1b1b1b]">AI Matching Methodology Standard</h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            HireLens AI computes a deterministic, multi-factor match score normalized between 0 and 100%. The scoring architecture comprises:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg border border-black/10 bg-white space-y-1">
              <span className="font-bold text-[#1b1b1b]">1. Mandatory Skills Coverage (40%)</span>
              <p className="text-neutral-500 text-[11px] font-sans">Exact canonical skill matches against normalized ontology.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-black/10 bg-white space-y-1">
              <span className="font-bold text-[#1b1b1b]">2. Semantic Resume Similarity (30%)</span>
              <p className="text-neutral-500 text-[11px] font-sans">TF-IDF cosine similarity comparing resume content and job description.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-black/10 bg-white space-y-1">
              <span className="font-bold text-[#1b1b1b]">3. Preferred Bonus Skills (15%)</span>
              <p className="text-neutral-500 text-[11px] font-sans">Bonus coverage for complementary technical tools.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-black/10 bg-white space-y-1">
              <span className="font-bold text-[#1b1b1b]">4. Experience Alignment (15%)</span>
              <p className="text-neutral-500 text-[11px] font-sans">Logarithmic curve evaluating candidate experience vs role expectations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
