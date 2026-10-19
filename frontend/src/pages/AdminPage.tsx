import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  History,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Loader2
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { api } from '../services/api';
import type { User, AuditLog, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [org, setOrg] = useState<{ id: string; name: string; domain?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'org'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [uList, logs, orgData] = await Promise.all([
        api.admin.listUsers(),
        api.admin.getAuditLogs({ limit: 50 }),
        api.admin.getOrg()
      ]);
      setUsers(uList);
      setAuditLogs(logs);
      setOrg(orgData);
      setOrgName(orgData.name || '');
      setOrgDomain(orgData.domain || '');
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.admin.updateUserRole(userId, newRole);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await api.admin.updateUserStatus(userId, !currentStatus);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to change user status');
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOrg(true);
    try {
      await api.admin.updateOrg({ name: orgName, domain: orgDomain });
      alert('Organization settings saved.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update organization');
    } finally {
      setIsSavingOrg(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar
        title="Admin Control Center"
        subtitle="Manage organization workspace permissions, user access roles, and immutable audit logs."
      />

      <div className="p-8 space-y-6 flex-1 max-w-6xl w-full mx-auto">
        {/* Navigation Tabs */}
        <div className="flex border-b border-border space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Members & Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => setActiveTab('org')}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              activeTab === 'org'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Organization Settings</span>
          </button>
        </div>

        {/* Tab 1: Users Table */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden space-y-4 p-6">
            <div>
              <h3 className="text-base font-bold text-foreground">User Management</h3>
              <p className="text-xs text-muted-foreground">
                Control access levels: Admin (full settings), Recruiter (jobs & candidates), Hiring Manager (reviews).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-foreground text-sm">{u.full_name}</p>
                          {isSelf && <span className="text-[10px] text-primary font-bold">(Current Account)</span>}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-3">
                          <select
                            disabled={isSelf}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="text-xs py-1 px-2 rounded-lg border border-input bg-background font-medium text-foreground disabled:opacity-50"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="RECRUITER">Recruiter</option>
                            <option value="HIRING_MANAGER">Hiring Manager</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              u.is_active
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleStatusToggle(u.id, u.is_active)}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                u.is_active
                                  ? 'text-rose-500 hover:bg-rose-500/10'
                                  : 'text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Security Audit Trail</h3>
              <p className="text-xs text-muted-foreground">Immutable historical record of operations performed within the organization.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Resource</th>
                    <th className="py-2.5 px-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 font-mono text-[11px]">
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {log.user_name || 'System'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {log.resource_type}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Org Settings */}
        {activeTab === 'org' && (
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-foreground">Organization Profile</h3>
              <p className="text-xs text-muted-foreground">Configure global company recruitment settings.</p>
            </div>

            <form onSubmit={handleUpdateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Corporate Domain</label>
                <input
                  type="text"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background"
                  placeholder="technova.io"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingOrg}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSavingOrg ? 'Saving...' : 'Save Organization Profile'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
