import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Clock,
  History,
  AlertCircle
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { ScoreBadge } from '../components/ScoreBadge';
import { api } from '../services/api';
import type { Application, Job, ApplicationStage } from '../types';

const PIPELINE_COLUMNS: Array<{
  stage: ApplicationStage;
  title: string;
  pastelBadge: string;
  pastelBorder: string;
}> = [
  { stage: 'APPLIED', title: 'Applied', pastelBadge: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]', pastelBorder: 'border-t-[#38bdf8]' },
  { stage: 'SCREENING', title: 'Screening', pastelBadge: 'bg-[#ede9fe] text-[#6d28d9] border-[#ddd6fe]', pastelBorder: 'border-t-[#a855f7]' },
  { stage: 'SHORTLISTED', title: 'Shortlisted', pastelBadge: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]', pastelBorder: 'border-t-[#22c55e]' },
  { stage: 'INTERVIEW', title: 'Interview', pastelBadge: 'bg-[#fef9c3] text-[#a16207] border-[#fef08a]', pastelBorder: 'border-t-[#eab308]' },
  { stage: 'OFFER', title: 'Offer', pastelBadge: 'bg-[#fae8ff] text-[#86198f] border-[#f5d0fe]', pastelBorder: 'border-t-[#d946ef]' },
  { stage: 'HIRED', title: 'Hired', pastelBadge: 'bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]', pastelBorder: 'border-t-[#14b8a6]' },
];

export const PipelinePage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchPipeline = async () => {
    try {
      setIsLoading(true);
      const [appList, jobList] = await Promise.all([
        api.applications.list(selectedJobId ? { job_id: selectedJobId } : undefined),
        api.jobs.list({ status: 'ACTIVE' })
      ]);
      setApplications(appList);
      setJobs(jobList.items);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [selectedJobId]);

  const handleStageChange = async (appId: string, newStage: ApplicationStage) => {
    try {
      // Optimistic update
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, stage: newStage } : a)
      );

      await api.applications.updateStage(appId, {
        stage: newStage,
        reason: `Moved via Kanban Pipeline to ${newStage}`
      });
      fetchPipeline();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update candidate stage');
      fetchPipeline();
    }
  };

  const handleOpenDetails = async (app: Application) => {
    try {
      const fullApp = await api.applications.get(app.id);
      setSelectedApp(fullApp);
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Failed to load application history:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Hiring Pipeline"
        subtitle="Visual Kanban stage workflow with persistent state tracking and history audit."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono hidden sm:inline uppercase">Position:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-white/20 bg-[#0d0d0d] text-white focus:outline-none focus:border-white font-mono"
            >
              <option value="">All Job Positions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Kanban Board Container */}
      <div className="p-6 lg:p-8 flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-10rem)]">
          {PIPELINE_COLUMNS.map((col, colIdx) => {
            const colApps = applications.filter((a) => a.stage === col.stage);

            return (
              <div
                key={col.stage}
                className={`flex-1 flex flex-col rounded-[16px] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] border-t-2 ${col.pastelBorder}`}
              >
                {/* Column Header with Pastel Count Badge */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <span className="text-xs font-semibold tracking-wider uppercase font-mono text-white">
                    {col.title}
                  </span>
                  <span className={`flex h-5 px-2 items-center justify-center rounded-full text-[10px] font-mono font-bold border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${col.pastelBadge}`}>
                    {colApps.length}
                  </span>
                </div>

                {/* Glossy Translucent Candidate Cards Column */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-[12px] border-t border-t-white border-x border-b border-black/10 bg-gradient-to-b from-white to-[#f8f9fa] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_20px_-4px_rgba(0,0,0,0.16)] hover:-translate-y-0.5 transition-all space-y-3 cursor-pointer group"
                      onClick={() => handleOpenDetails(app)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-[#1b1b1b] text-sm group-hover:text-[#0284c7] transition-colors">
                            {app.candidate_name}
                          </h4>
                          <p className="text-[11px] text-neutral-500 line-clamp-1">{app.job_title}</p>
                        </div>
                        {app.match_score && (
                          <ScoreBadge score={app.match_score.overall_score} size="sm" />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-2 border-t border-black/10">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {new Date(app.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>

                        {/* Stage Transition Quick Arrows */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {colIdx > 0 && (
                            <button
                              onClick={() => handleStageChange(app.id, PIPELINE_COLUMNS[colIdx - 1].stage)}
                              title={`Move back to ${PIPELINE_COLUMNS[colIdx - 1].title}`}
                              className="p-1 rounded-md bg-black/5 hover:bg-black/15 text-[#1b1b1b] transition-colors border border-black/5"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {colIdx < PIPELINE_COLUMNS.length - 1 && (
                            <button
                              onClick={() => handleStageChange(app.id, PIPELINE_COLUMNS[colIdx + 1].stage)}
                              title={`Advance to ${PIPELINE_COLUMNS[colIdx + 1].title}`}
                              className="p-1 rounded-md bg-[#1b1b1b] text-white hover:bg-black transition-colors shadow-sm"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="py-8 text-center text-xs text-neutral-500 font-mono border border-dashed border-white/10 rounded-xl">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Application & History Modal */}
      {selectedApp && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedApp.candidate_name || 'Application Details'}
          subtitle={`Position: ${selectedApp.job_title} (${selectedApp.job_department})`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-gradient-to-b from-white to-[#fbfbfa] border-t border-t-white border-black/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_2px_6px_rgba(0,0,0,0.04)] gap-4">
              <div>
                <span className="text-xs text-neutral-500 font-mono block mb-1">Current Stage</span>
                <span className="text-sm font-bold text-[#1b1b1b]">{selectedApp.stage}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 font-mono block mb-1">Applied On</span>
                <span className="text-xs font-semibold text-[#1b1b1b] font-mono">
                  {new Date(selectedApp.applied_at).toLocaleString()}
                </span>
              </div>
              {selectedApp.match_score && (
                <div>
                  <span className="text-xs text-neutral-500 font-mono block mb-1">AI Match Score</span>
                  <ScoreBadge score={selectedApp.match_score.overall_score} size="md" />
                </div>
              )}
            </div>

            {/* Score Explanation */}
            {selectedApp.match_score && (
              <div className="p-4 rounded-xl border-t border-t-white border-black/10 bg-gradient-to-b from-white to-[#fbfbfa] shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_2px_6px_rgba(0,0,0,0.04)] text-xs space-y-1">
                <span className="font-bold text-[#0369a1] flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
                  Score Rationale
                </span>
                <p className="text-neutral-600 leading-relaxed">
                  {selectedApp.match_score.score_explanation}
                </p>
              </div>
            )}

            {/* Stage Transition History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1b1b1b] uppercase font-mono tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-neutral-700" />
                Stage Transition Audit Log
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedApp.stage_history?.map((hist: any) => (
                  <div key={hist.id} className="p-3 rounded-xl bg-gradient-to-b from-white to-[#fbfbfa] border-t border-t-white border-black/10 shadow-sm text-xs flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[#1b1b1b]">
                        {hist.from_stage} → <span className="text-[#0284c7] font-bold">{hist.to_stage}</span>
                      </p>
                      <p className="text-neutral-500 text-[11px] mt-0.5">{hist.reason || 'Stage updated'}</p>
                    </div>
                    <div className="text-right text-[10px] text-neutral-500 font-mono">
                      <p className="font-medium text-[#1b1b1b]">{hist.changed_by_name || 'System'}</p>
                      <p>{new Date(hist.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Stage Transition Actions */}
            <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-neutral-600 font-mono">Transition stage:</span>
              <div className="flex flex-wrap gap-1.5">
                {PIPELINE_COLUMNS.map((col) => (
                  <button
                    key={col.stage}
                    disabled={selectedApp.stage === col.stage}
                    onClick={() => {
                      handleStageChange(selectedApp.id, col.stage);
                      setIsDetailOpen(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      selectedApp.stage === col.stage
                        ? 'bg-black text-white opacity-50 cursor-not-allowed shadow-none'
                        : 'air-button-light hover:border-black/30'
                    }`}
                  >
                    {col.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
