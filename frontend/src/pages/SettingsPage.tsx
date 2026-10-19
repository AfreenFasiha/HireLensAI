import React, { useState } from 'react';
import {
  Settings,
  User,
  Lock,
  Moon,
  Sun,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Building,
  Loader2
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
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar
        title="Settings & Preferences"
        subtitle="Configure profile credentials, workspace appearance, and AI matching parameters."
      />

      <div className="p-8 space-y-8 flex-1 max-w-4xl w-full mx-auto">
        {statusMsg && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Profile & Security Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Personal Profile & Security</h3>
            <p className="text-xs text-muted-foreground">Manage your recruiter credentials and authentication password.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-secondary/50 text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Change Password (Optional)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Workspace Theme Preference */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Appearance & Interface Theme</h3>
            <p className="text-xs text-muted-foreground">Select your preferred color scheme for the application.</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                theme === 'light'
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border bg-secondary/30 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-foreground">Light Theme</p>
                  <p className="text-[10px] text-muted-foreground">Crisp clean slate and white contrast</p>
                </div>
              </div>
              {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </button>

            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                theme === 'dark'
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border bg-secondary/30 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-foreground">Dark Theme</p>
                  <p className="text-[10px] text-muted-foreground">Modern deep slate with violet accents</p>
                </div>
              </div>
              {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </button>
          </div>
        </div>

        {/* AI Matching Architecture Details */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sliders className="w-5 h-5" />
            <h3 className="text-base font-bold text-foreground">AI Matching Methodology Standard</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            HireLens AI computes a deterministic, multi-factor match score normalized between 0 and 100%. The scoring architecture comprises:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
              <span className="font-bold text-foreground">1. Mandatory Skills Coverage (40%)</span>
              <p className="text-muted-foreground text-[11px]">Exact canonical skill matches against normalized ontology.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
              <span className="font-bold text-foreground">2. Semantic Resume Similarity (30%)</span>
              <p className="text-muted-foreground text-[11px]">TF-IDF cosine similarity comparing resume content and job description.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
              <span className="font-bold text-foreground">3. Preferred Bonus Skills (15%)</span>
              <p className="text-muted-foreground text-[11px]">Bonus coverage for complementary technical tools.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
              <span className="font-bold text-foreground">4. Experience Alignment (15%)</span>
              <p className="text-muted-foreground text-[11px]">Logarithmic curve evaluating candidate experience vs role expectations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
