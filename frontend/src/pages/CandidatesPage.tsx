import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  UploadCloud,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Trash2,
  Send
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { ScoreBadge } from '../components/ScoreBadge';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { api } from '../services/api';
import type { Candidate, Job, Application } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const CandidatesPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateNotes, setCandidateNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Apply to Job Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [candidateToApply, setCandidateToApply] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const { hasRole } = useAuth();

  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      const res = await api.candidates.list({
        search: search || undefined,
        skill: skillFilter || undefined,
        page,
        page_size: 15
      });
      setCandidates(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, skillFilter, page]);

  const handleOpenCandidateDetails = async (cand: Candidate) => {
    try {
      const fullCand = await api.candidates.get(cand.id);
      setSelectedCandidate(fullCand);
      setCandidateNotes(fullCand.notes || []);
    } catch (err) {
      console.error('Failed to get candidate details:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !newNoteContent.trim()) return;
    setIsAddingNote(true);

    try {
      const note = await api.candidates.addNote(selectedCandidate.id, {
        content: newNoteContent.trim(),
        is_private: false
      });
      setCandidateNotes(prev => [note, ...prev]);
      setNewNoteContent('');
    } catch (err) {
      alert('Failed to save note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleOpenApply = async (cand: Candidate) => {
    setCandidateToApply(cand);
    try {
      const jList = await api.jobs.list({ status: 'ACTIVE' });
      setJobs(jList.items);
      if (jList.items.length > 0) {
        setSelectedJobId(jList.items[0].id);
      }
      setIsApplyModalOpen(true);
    } catch (err) {
      console.error('Failed to load active jobs:', err);
    }
  };

  const handleSubmitApplication = async () => {
    if (!candidateToApply || !selectedJobId) return;
    setIsApplying(true);
    try {
      await api.applications.create({
        job_id: selectedJobId,
        candidate_id: candidateToApply.id
      });
      alert('Application created and AI matching evaluation generated successfully!');
      setIsApplyModalOpen(false);
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply candidate.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (window.confirm('Delete this candidate and associated resume records?')) {
      try {
        await api.candidates.delete(id);
        fetchCandidates();
        if (selectedCandidate?.id === id) {
          setSelectedCandidate(null);
        }
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete candidate.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar
        title="Candidate Management"
        subtitle="Search candidates, review parsed resumes, and track talent profiles."
        actions={
          hasRole(['ADMIN', 'RECRUITER']) && (
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Resume (PDF / DOCX)</span>
            </button>
          )
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or role title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter by skill (e.g. Python, React)..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>
        </div>

        {/* Candidate Table */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Candidate Profile</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Skills ({skillFilter || 'All'})</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Active Apps</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase">
                          {cand.full_name ? cand.full_name[0] : 'C'}
                        </div>
                        <div>
                          <button
                            onClick={() => handleOpenCandidateDetails(cand)}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors text-left"
                          >
                            {cand.full_name}
                          </button>
                          <p className="text-[11px] text-muted-foreground">{cand.current_title || 'Software Professional'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span>{cand.email}</span>
                      </div>
                      {cand.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          <span>{cand.phone}</span>
                        </div>
                      )}
                      {cand.location && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{cand.location}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {cand.skills?.slice(0, 4).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-foreground border border-border"
                          >
                            {s.skill_name}
                          </span>
                        ))}
                        {cand.skills?.length > 4 && (
                          <span className="text-[10px] text-muted-foreground font-medium self-center">
                            +{cand.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-foreground font-mono">{cand.experience_years} yrs</span>
                      <p className="text-[11px] text-muted-foreground">{cand.education_level || "Bachelor's"}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {cand.active_applications_count || 0} Apps
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenApply(cand)}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors"
                      >
                        Apply to Job
                      </button>
                      <button
                        onClick={() => handleOpenCandidateDetails(cand)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}

                {candidates.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No candidates found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Candidate Full Profile Detail Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={selectedCandidate.full_name}
          subtitle={`${selectedCandidate.current_title || 'Software Professional'} • ${selectedCandidate.experience_years} Years Experience`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Contact info bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px]">Email</span>
                <span className="font-semibold text-foreground">{selectedCandidate.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Phone</span>
                <span className="font-semibold text-foreground">{selectedCandidate.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Education</span>
                <span className="font-semibold text-foreground">{selectedCandidate.education_level || "Bachelor's"}</span>
              </div>
            </div>

            {/* Summary */}
            {selectedCandidate.summary && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Professional Summary
                </h4>
                <p className="text-xs text-foreground/90 leading-relaxed bg-secondary/20 p-3 rounded-lg border border-border">
                  {selectedCandidate.summary}
                </p>
              </div>
            )}

            {/* Technical Skills */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                Verified Technical Skills ({selectedCandidate.skills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills?.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {s.skill_name} <span className="opacity-60 text-[10px]">({s.category || 'Skill'})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Resume File Actions */}
            {selectedCandidate.latest_resume_id && (
              <div className="p-3 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {selectedCandidate.latest_resume_file_name || 'Resume Document'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Original uploaded resume</p>
                  </div>
                </div>
                <a
                  href={api.candidates.downloadResumeUrl(selectedCandidate.id, selectedCandidate.latest_resume_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {/* Recruiter Notes Section */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                Recruiter Evaluation Notes
              </h4>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add an internal evaluation note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="submit"
                  disabled={isAddingNote || !newNoteContent.trim()}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {candidateNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-secondary/30 border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                      <span className="font-semibold text-foreground">{note.author_name || 'Recruiter'}</span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-foreground/90">{note.content}</p>
                  </div>
                ))}
                {candidateNotes.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No recruiter notes recorded yet.</p>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            {hasRole(['ADMIN', 'RECRUITER']) && (
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Manage profile integrity</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCandidate(selectedCandidate.id)}
                  className="text-xs font-medium text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Candidate Record</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Apply Candidate to Job Modal */}
      {isApplyModalOpen && candidateToApply && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title={`Associate ${candidateToApply.full_name} with Job`}
          subtitle="Select an active job requisition to trigger automated multi-factor AI matching."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Target Job Opening *</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={isApplying}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isApplying ? 'Evaluating Match...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onSuccess={() => {
          fetchCandidates();
        }}
      />
    </div>
  );
};
