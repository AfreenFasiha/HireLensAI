import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  TrendingUp,
  Percent,
  Layers
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import type { AnalyticsDashboard, Job } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const [dash, jobList] = await Promise.all([
        api.analytics.getDashboard({
          job_id: selectedJobId || undefined,
          days: daysFilter
        }),
        api.jobs.list()
      ]);
      setAnalytics(dash);
      setJobs(jobList.items);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedJobId, daysFilter]);

  const handleExportCsv = () => {
    const url = api.analytics.getExportCsvUrl(selectedJobId || undefined);
    window.open(url, '_blank');
  };

  const STAGE_PALETTE = ['#6366f1', '#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#22c55e', '#ef4444', '#94a3b8'];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar
        title="Recruitment Analytics"
        subtitle="Data-driven hiring intelligence, conversion funnels, and skill distributions."
        actions={
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      <div className="p-8 space-y-8 flex-1 max-w-6xl w-full mx-auto">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            >
              <option value="">All Job Positions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Time Horizon:</span>
            <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 text-xs">
              {[7, 30, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysFilter(d)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    daysFilter === d
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Conversion Funnel KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Shortlist Rate"
            value={`${analytics?.conversion_metrics.shortlist_rate ?? 0}%`}
            subtitle="Applied to qualified ratio"
            icon={Percent}
          />
          <MetricCard
            title="Interview Conversion"
            value={`${analytics?.conversion_metrics.interview_conversion_rate ?? 0}%`}
            subtitle="Moved to interview round"
            icon={Calendar}
          />
          <MetricCard
            title="Hiring Rate"
            value={`${analytics?.conversion_metrics.hire_conversion_rate ?? 0}%`}
            subtitle="Successful offer acceptances"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Avg Time to Hire"
            value={`${analytics?.conversion_metrics.average_time_to_hire_days ?? 0} days`}
            subtitle="Application to offer cycle"
            icon={Clock}
          />
        </div>

        {/* First Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications Timeline */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Applications Inflow Over Time</h3>
              <p className="text-xs text-muted-foreground">Volume of candidate submissions across selected window</p>
            </div>
            <div className="h-64 w-full">
              {analytics && analytics.applications_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.applications_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
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
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#f8fafc'
                      }}
                    />
                    <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} fill="url(#areaColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No submissions recorded
                </div>
              )}
            </div>
          </div>

          {/* AI Match Score Distribution Histogram */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">AI Match Score Distribution</h3>
              <p className="text-xs text-muted-foreground">Candidate ranking distribution across score bands</p>
            </div>
            <div className="h-64 w-full">
              {analytics && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#f8fafc'
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Applications by Job & Stage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications by Job Position */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Applications by Position</h3>
              <p className="text-xs text-muted-foreground">Requisitions volume and average AI match scores</p>
            </div>
            <div className="h-64 w-full">
              {analytics && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.jobs_metrics} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="job_title"
                      type="category"
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      width={120}
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
                    <Bar dataKey="applications_count" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Applications" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pipeline Stage Distribution Pie */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Candidate Stage Distribution</h3>
              <p className="text-xs text-muted-foreground">Current distribution across the active hiring funnel</p>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {analytics && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.stage_distribution}
                      dataKey="count"
                      nameKey="stage"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {analytics.stage_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STAGE_PALETTE[index % STAGE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#f8fafc'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
