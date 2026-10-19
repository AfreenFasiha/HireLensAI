import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Plus,
  UploadCloud,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { MetricCard } from '../components/MetricCard';
import { ScoreBadge } from '../components/ScoreBadge';
import { StageBadge } from '../components/StageBadge';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { api } from '../services/api';
import type { AnalyticsDashboard, Application, Interview } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(30);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dash, apps, interviews] = await Promise.all([
        api.analytics.getDashboard({ days: daysFilter }),
        api.applications.list(),
        api.interviews.list({ upcoming_only: true })
      ]);
      setAnalytics(dash);
      setRecentApps(apps.slice(0, 5));
      setUpcomingInterviews(interviews.slice(0, 4));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [daysFilter]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Dashboard"
        subtitle="Intelligent recruitment telemetry, pipeline velocity, and candidate rankings."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="air-button-ghost text-xs px-3.5 py-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 opacity-80" />
              <span>Parse Resume</span>
            </button>
            <Link
              to="/jobs?create=true"
              className="air-button-solid-white text-xs px-3.5 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Job</span>
            </Link>
          </div>
        }
      />

      <div className="max-w-[1150px] mx-auto w-full p-6 lg:p-8 space-y-12 flex-1">
        {/* Date Filter & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Timeframe:</span>
            <div className="flex rounded-full border border-white/20 bg-white/5 p-1 text-xs">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysFilter(d)}
                  className={`px-3 py-1 rounded-full font-mono text-xs transition-all ${
                    daysFilter === d
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-500 font-mono">Live PostgreSQL Stream</p>
        </div>

        {/* 6 Metric KPI Cards (air-card off-white) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <MetricCard
            title="Candidates"
            value={analytics?.overview?.total_candidates ?? 0}
            subtitle="Talent records"
            icon={Users}
          />
          <MetricCard
            title="Active Jobs"
            value={analytics?.overview?.active_job_openings ?? 0}
            subtitle="Open requisitions"
            icon={Briefcase}
          />
          <MetricCard
            title="Interviews"
            value={analytics?.overview?.interviews_scheduled ?? 0}
            subtitle="Scheduled sessions"
            icon={Calendar}
          />
          <MetricCard
            title="Shortlisted"
            value={analytics?.overview?.candidates_shortlisted ?? 0}
            subtitle="Qualified applicants"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Monthly Apps"
            value={analytics?.overview?.applications_this_month ?? 0}
            subtitle="Submissions"
            icon={TrendingUp}
          />
          <MetricCard
            title="Match Avg"
            value={`${analytics?.overview?.average_match_score ?? 0}%`}
            subtitle="Explainable rating"
            icon={Sparkles}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications Trend Area Chart */}
          <div className="lg:col-span-2 air-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <h3 className="text-base font-bold text-[#1b1b1b]">Application Activity Volume</h3>
                <p className="text-xs text-neutral-500">Applicant submissions across selected timeframe</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">
                Synchronized
              </span>
            </div>

            <div className="h-64 w-full">
              {analytics && analytics.applications_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.applications_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="airAppTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#426188" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#426188" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#737373' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#737373' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e5e5',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#1b1b1b',
                        boxShadow: 'none'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="#426188"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#airAppTrend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                  No activity recorded for this period
                </div>
              )}
            </div>
          </div>

          {/* Hiring Pipeline Stage Distribution Bar Chart */}
          <div className="air-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <h3 className="text-base font-bold text-[#1b1b1b]">Pipeline Stages</h3>
                <p className="text-xs text-neutral-500">Applicant status breakdown</p>
              </div>
              <Link to="/pipeline" className="text-xs text-[#2b7fff] hover:underline font-medium font-mono flex items-center gap-1">
                Kanban <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="h-64 w-full">
              {analytics && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.stage_distribution} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="stage"
                      type="category"
                      tick={{ fontSize: 9, fill: '#737373' }}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e5e5',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#1b1b1b',
                        boxShadow: 'none'
                      }}
                    />
                    <Bar dataKey="count" fill="#1b1b1b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Applications & Upcoming Interviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications Table */}
          <div className="lg:col-span-2 air-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <h3 className="text-base font-bold text-[#1b1b1b]">Recent Applications</h3>
                <p className="text-xs text-neutral-500">Evaluated candidate submissions</p>
              </div>
              <Link to="/candidates" className="text-xs text-[#2b7fff] hover:underline font-mono font-medium flex items-center gap-1">
                Talent Pool <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Target Role</th>
                    <th className="py-2.5 px-3">Match</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#1b1b1b] text-sm">{app.candidate_name}</p>
                        <p className="text-[11px] text-neutral-500 font-mono">{app.candidate_email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-[#1b1b1b]">{app.job_title}</p>
                        <p className="text-[11px] text-neutral-500">{app.job_department}</p>
                      </td>
                      <td className="py-3 px-3">
                        {app.match_score ? (
                          <ScoreBadge score={app.match_score.overall_score} size="sm" />
                        ) : (
                          <span className="text-neutral-400 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StageBadge stage={app.stage} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/jobs/${app.job_id}/rankings`}
                          className="text-[#2b7fff] hover:underline font-mono font-medium"
                        >
                          Rankings
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recentApps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500">
                        No applications recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Interviews Card */}
          <div className="air-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <h3 className="text-base font-bold text-[#1b1b1b]">Upcoming Interviews</h3>
                <p className="text-xs text-neutral-500">Scheduled recruiter rounds</p>
              </div>
              <Link to="/interviews" className="text-xs text-[#2b7fff] hover:underline font-mono font-medium flex items-center gap-1">
                Calendar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingInterviews.map((iv) => (
                <div key={iv.id} className="p-3.5 rounded-lg border border-black/10 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1b1b1b] truncate max-w-[170px]">{iv.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">
                      {iv.interview_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-neutral-700" />
                    <span>{new Date(iv.scheduled_start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {iv.meeting_link && (
                    <a
                      href={iv.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#2b7fff] hover:underline font-mono pt-1"
                    >
                      <span>Join Meeting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
              {upcomingInterviews.length === 0 && (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No upcoming interviews scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};
