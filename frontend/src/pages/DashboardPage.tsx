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
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar
        title="Dashboard"
        subtitle="Intelligent recruitment overview, pipeline status, and candidate rankings."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-secondary border border-border hover:bg-secondary/80 text-foreground flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-primary" />
              <span>Parse Resume</span>
            </button>
            <Link
              to="/jobs?create=true"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Job</span>
            </Link>
          </div>
        }
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Date Filter & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Date Range:</span>
            <div className="flex rounded-lg border border-border bg-card p-0.5 text-xs">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysFilter(d)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    daysFilter === d
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Real-time PostgreSQL telemetry</p>
        </div>

        {/* 6 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Candidates"
            value={analytics?.overview?.total_candidates ?? 0}
            subtitle="In database talent pool"
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
            subtitle="Qualified candidates"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Monthly Apps"
            value={analytics?.overview?.applications_this_month ?? 0}
            subtitle="Current calendar month"
            icon={TrendingUp}
          />
          <MetricCard
            title="Avg Match Score"
            value={`${analytics?.overview?.average_match_score ?? 0}%`}
            subtitle="Explainable AI rating"
            icon={Sparkles}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications Trend Area Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Application Activity Timeline</h3>
                <p className="text-xs text-muted-foreground">Applicant submissions across selected timeframe</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Live Data
              </span>
            </div>

            <div className="h-64 w-full">
              {analytics && analytics.applications_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.applications_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="appTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stop-color="#6366f1" stop-opacity={0.3} />
                        <stop offset="95%" stop-color="#6366f1" stop-opacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#f8fafc'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#appTrend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No activity recorded for this period
                </div>
              )}
            </div>
          </div>

          {/* Hiring Pipeline Stage Distribution Bar Chart */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Pipeline Stages</h3>
                <p className="text-xs text-muted-foreground">Current applicant stage breakdown</p>
              </div>
              <Link to="/pipeline" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
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
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#f8fafc'
                      }}
                    />
                    <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Applications & Upcoming Interviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications Table */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Recent Applications</h3>
                <p className="text-xs text-muted-foreground">Candidates evaluated by AI matching engine</p>
              </div>
              <Link to="/candidates" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                View all candidates <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Target Role</th>
                    <th className="py-2.5 px-3">AI Match</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-foreground text-sm">{app.candidate_name}</p>
                        <p className="text-[11px] text-muted-foreground">{app.candidate_email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-foreground">{app.job_title}</p>
                        <p className="text-[11px] text-muted-foreground">{app.job_department}</p>
                      </td>
                      <td className="py-3 px-3">
                        {app.match_score ? (
                          <ScoreBadge score={app.match_score.overall_score} size="sm" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StageBadge stage={app.stage} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/jobs/${app.job_id}/rankings`}
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          Rankings
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recentApps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No applications recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Interviews Card */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Upcoming Interviews</h3>
                <p className="text-xs text-muted-foreground">Next scheduled recruitment rounds</p>
              </div>
              <Link to="/interviews" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                Calendar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingInterviews.map((iv) => (
                <div key={iv.id} className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate max-w-[180px]">{iv.title}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {iv.interview_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{new Date(iv.scheduled_start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {iv.meeting_link && (
                    <a
                      href={iv.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium pt-1"
                    >
                      <span>Join Meeting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
              {upcomingInterviews.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
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
