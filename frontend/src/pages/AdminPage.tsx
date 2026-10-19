import React, { useState, useEffect } from 'react';
import {
  Users,
  History,
  Building,
  CheckCircle2,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { api } from '../services/api';
import type { User, AuditLog } from '../types';
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Admin Control Center"
        subtitle="Manage workspace permissions, user access roles, and immutable audit logs."
      />

      <div className="p-6 lg:p-8 space-y-8 flex-1 max-w-[1150px] w-full mx-auto">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 space-x-6 text-xs font-mono uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-b-2 border-white text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Members</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-b-2 border-white text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => setActiveTab('org')}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              activeTab === 'org'
                ? 'border-b-2 border-white text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Organization</span>
          </button>
        </div>

        {/* Tab 1: Users Table */}
        {activeTab === 'users' && (
          <div className="air-card space-y-4">
            <div className="pb-3 border-b border-black/10">
              <h3 className="text-base font-bold text-[#1b1b1b]">User Access & Roles</h3>
              <p className="text-xs text-neutral-500 font-mono">
                Admin (full privileges), Recruiter (requisitions & candidates), Hiring Manager (reviews).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-black/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#1b1b1b] text-sm">{u.full_name}</p>
                          {isSelf && <span className="text-[10px] text-[#2b7fff] font-mono font-bold">(Active Session)</span>}
                        </td>
                        <td className="py-3 px-3 text-neutral-600 font-mono">{u.email}</td>
                        <td className="py-3 px-3">
                          <select
                            disabled={isSelf}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="air-input text-xs py-1 px-2 font-mono"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="RECRUITER">Recruiter</option>
                            <option value="HIRING_MANAGER">Hiring Manager</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                              u.is_active
                                ? 'bg-black/5 text-[#1b1b1b] border-black/10'
                                : 'bg-black/5 text-neutral-400 border-black/10 line-through'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleStatusToggle(u.id, u.is_active)}
                              className="air-button-light text-xs py-1 px-2.5"
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
          <div className="air-card space-y-4">
            <div className="pb-3 border-b border-black/10">
              <h3 className="text-base font-bold text-[#1b1b1b]">Security Audit Trail</h3>
              <p className="text-xs text-neutral-500 font-mono">Immutable ledger of privileged recruitment operations.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-black/10 text-neutral-500 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Resource</th>
                    <th className="py-2.5 px-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-black/[0.02]">
                      <td className="py-2.5 px-3 text-neutral-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#1b1b1b]">
                        {log.user_name || 'System'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10 text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600">
                        {log.resource_type}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500">
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
          <div className="air-card space-y-4 max-w-xl">
            <div className="pb-3 border-b border-black/10">
              <h3 className="text-base font-bold text-[#1b1b1b]">Organization Profile</h3>
              <p className="text-xs text-neutral-500 font-mono">Configure global company recruitment settings.</p>
            </div>

            <form onSubmit={handleUpdateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="air-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Corporate Domain</label>
                <input
                  type="text"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  className="air-input text-xs"
                  placeholder="technova.io"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingOrg}
                className="bg-[#1b1b1b] text-white hover:bg-black rounded-lg px-4 py-2 font-medium text-xs disabled:opacity-50"
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
