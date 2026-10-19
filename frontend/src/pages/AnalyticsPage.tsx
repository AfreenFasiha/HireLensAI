import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Percent
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

  // Soft luminous pastel palette for pipeline stages (Sky, Lavender, Mint, Peach, Rose, Butter, Sage, Slate)
  const AIR_STAGE_PALETTE = ['#38bdf8', '#a78bfa', '#4ade80', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#94a3b8'];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Recruitment Analytics"
        subtitle="Data-driven hiring intelligence, conversion funnels, and skill distributions."
        actions={
          <button
            onClick={handleExportCsv}
            className="air-button-solid-white text-xs px-3.5 py-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      <div className="p-6 lg:p-8 space-y-8 flex-1 max-w-[1150px] w-full mx-auto">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-white/20 bg-[#0d0d0d] text-white focus:outline-none focus:border-white font-mono"
            >
              <option value="">All Job Positions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 font-mono uppercase">Timeframe:</span>
            <div className="flex rounded-full border border-white/20 bg-white/5 p-1 text-xs">
              {[7, 30, 90, 180].map((d) => (
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
        </div>

        {/* 4 Conversion Funnel KPI Cards (air-card with glossy pastel accents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Shortlist Rate"
            value={`${analytics?.conversion_metrics.shortlist_rate ?? 0}%`}
            subtitle="Applied to qualified ratio"
            icon={Percent}
            pastelColor="lavender"
          />
          <MetricCard
            title="Interview Conversion"
            value={`${analytics?.conversion_metrics.interview_conversion_rate ?? 0}%`}
            subtitle="Advanced to rounds"
            icon={Calendar}
            pastelColor="sky"
          />
          <MetricCard
            title="Hiring Rate"
            value={`${analytics?.conversion_metrics.hire_conversion_rate ?? 0}%`}
            subtitle="Offer acceptances"
            icon={CheckCircle2}
            pastelColor="mint"
          />
          <MetricCard
            title="Time to Hire"
            value={`${analytics?.conversion_metrics.average_time_to_hire_days ?? 0}d`}
            subtitle="Application to offer cycle"
            icon={Clock}
            pastelColor="peach"
          />
        </div>

        {/* First Row of Charts (air-card containers) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications Timeline */}
          <div className="air-card space-y-4">
            <div className="pb-3 border-b border-black/10">
              <h3 className="text-base font-bold text-[#1b1b1b]">Applications Inflow Over Time</h3>
              <p className="text-xs text-neutral-500">Volume of candidate submissions across selected window</p>
            </div>
            <div className="h-64 w-full">
              {analytics && analytics.applications_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.applications_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pastelInflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#737373' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#737373' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#bae6fd',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#1b1b1b',
                        boxShadow: '0 4px 12px rgba(56, 189, 248, 0.15)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      fill="url(#pastelInflow)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                  No submissions recorded
                </div>
              )}
            </div>
          </div>

          {/* AI Match Score Distribution Histogram */}
          <div className="air-card space-y-4">
            <div className="pb-3 border-b border-black/10">
              <h3 className="text-base font-bold text-[#1b1b1b]">AI Match Score Distribution</h3>
              <p className="text-xs text-neutral-500">Candidate ranking distribution across score bands</p>
            </div>
            <div className="h-64 w-full">
              {analytics && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#737373' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#737373' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#ddd6fe',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#1b1b1b',
                        boxShadow: '0 4px 12px rgba(167, 139, 250, 0.15)'
                      }}
                    />
                    <Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Applications by Job & Stage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications by Job Position */}
          <div className="air-card space-y-4">
            <div className="pb-3 border-b border-black/10">
              <h3 className="text-base font-bold text-[#1b1b1b]">Applications by Position</h3>
              <p className="text-xs text-neutral-500">Requisitions volume and applicant counts</p>
            </div>
            <div className="h-64 w-full">
              {analytics && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.jobs_metrics} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="job_title"
                      type="category"
                      tick={{ fontSize: 9, fill: '#737373' }}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#bbf7d0',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#1b1b1b',
                        boxShadow: '0 4px 12px rgba(74, 222, 128, 0.15)'
                      }}
                    />
                    <Bar dataKey="applications_count" fill="#34d399" radius={[0, 6, 6, 0]} name="Applications" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pipeline Stage Distribution Pie */}
          <div className="air-card space-y-4">
            <div className="pb-3 border-b border-black/10">
              <h3 className="text-base font-bold text-[#1b1b1b]">Candidate Stage Distribution</h3>
              <p className="text-xs text-neutral-500">Current allocation across hiring funnel</p>
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
                      outerRadius={78}
                      innerRadius={46}
                      paddingAngle={3}
                    >
                      {analytics.stage_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={AIR_STAGE_PALETTE[index % AIR_STAGE_PALETTE.length]} />
                      ))}
                    </Pie>
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
                    <Legend wrapperStyle={{ fontSize: '10px', color: '#1b1b1b' }} />
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
