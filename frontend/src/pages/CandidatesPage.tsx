import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UploadCloud,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Trash2,
  Send
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { api } from '../services/api';
import type { Candidate, Job } from '../types';
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Candidate Management"
        subtitle="Search candidates, review parsed resumes, and track talent profiles."
        actions={
          hasRole(['ADMIN', 'RECRUITER']) && (
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="air-button-solid-white text-xs px-3.5 py-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Resume</span>
            </button>
          )
        }
      />

      <div className="p-6 lg:p-8 space-y-8 flex-1 max-w-[1150px] w-full mx-auto">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 rounded-lg border border-white/10 bg-white/[0.03]">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-white/20 bg-[#0d0d0d] text-white focus:outline-none focus:border-white font-mono"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter by skill (e.g. Python, React)..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded border border-white/20 bg-[#0d0d0d] text-white focus:outline-none focus:border-white font-mono w-full sm:w-64"
            />
          </div>
        </div>

        {/* Candidate Table in Off-White Card Container */}
        <div className="air-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/10 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-4">Candidate Profile</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Skills</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Applications</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {candidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-black/5 text-[#1b1b1b] font-mono font-bold text-xs uppercase border border-black/10">
                          {cand.full_name ? cand.full_name[0] : 'C'}
                        </div>
                        <div>
                          <button
                            onClick={() => handleOpenCandidateDetails(cand)}
                            className="font-bold text-sm text-[#1b1b1b] hover:text-[#2b7fff] transition-colors text-left"
                          >
                            {cand.full_name}
                          </button>
                          <p className="text-[11px] text-neutral-500 font-mono">{cand.current_title || 'Software Professional'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-neutral-600 text-[11px] font-mono">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{cand.email}</span>
                      </div>
                      {cand.phone && (
                        <div className="flex items-center gap-1.5 text-neutral-600 text-[11px] font-mono">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{cand.phone}</span>
                        </div>
                      )}
                      {cand.location && (
                        <div className="flex items-center gap-1.5 text-neutral-600 text-[11px] font-mono">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{cand.location}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {cand.skills?.slice(0, 4).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/5 text-[#1b1b1b] border border-black/10"
                          >
                            {s.skill_name}
                          </span>
                        ))}
                        {cand.skills?.length > 4 && (
                          <span className="text-[10px] text-neutral-500 font-mono self-center">
                            +{cand.skills.length - 4}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-[#1b1b1b]">{cand.experience_years} yrs</span>
                      <p className="text-[10px] text-neutral-500">{cand.education_level || "Bachelor's"}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-black/5 text-[#1b1b1b] border border-black/10">
                        {cand.active_applications_count || 0} Apps
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenApply(cand)}
                        className="air-button-light text-xs py-1 px-2.5"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleOpenCandidateDetails(cand)}
                        className="air-button-light text-xs py-1 px-2.5"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}

                {candidates.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500 font-mono">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-white border border-black/10 text-xs font-mono">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Email</span>
                <span className="font-semibold text-[#1b1b1b]">{selectedCandidate.email}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Phone</span>
                <span className="font-semibold text-[#1b1b1b]">{selectedCandidate.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Education</span>
                <span className="font-semibold text-[#1b1b1b]">{selectedCandidate.education_level || "Bachelor's"}</span>
              </div>
            </div>

            {/* Summary */}
            {selectedCandidate.summary && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#1b1b1b] uppercase font-mono tracking-wider">
                  Professional Summary
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed bg-white p-3 rounded-lg border border-black/10">
                  {selectedCandidate.summary}
                </p>
              </div>
            )}

            {/* Technical Skills */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-[#1b1b1b] uppercase font-mono tracking-wider">
                Verified Technical Skills ({selectedCandidate.skills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills?.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-black/5 text-[#1b1b1b] border border-black/10"
                  >
                    {s.skill_name} <span className="opacity-50 text-[10px]">({s.category || 'Skill'})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Resume File Actions */}
            {selectedCandidate.latest_resume_id && (
              <div className="p-3.5 rounded-lg border border-black/10 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1b1b1b]" />
                  <div>
                    <p className="text-xs font-semibold text-[#1b1b1b]">
                      {selectedCandidate.latest_resume_file_name || 'Resume Document'}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">Original verified PDF/DOCX</p>
                  </div>
                </div>
                <a
                  href={api.candidates.downloadResumeUrl(selectedCandidate.id, selectedCandidate.latest_resume_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="air-button-light text-xs py-1 px-3"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {/* Recruiter Notes Section */}
            <div className="space-y-3 pt-4 border-t border-black/10">
              <h4 className="text-xs font-bold text-[#1b1b1b] uppercase font-mono tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-neutral-700" />
                Recruiter Evaluation Notes
              </h4>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add an internal evaluation note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="air-input text-xs"
                />
                <button
                  type="submit"
                  disabled={isAddingNote || !newNoteContent.trim()}
                  className="bg-[#1b1b1b] text-white hover:bg-black rounded-lg px-3 py-1.5 font-medium text-xs flex items-center gap-1 disabled:opacity-50 shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>Post</span>
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {candidateNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-white border border-black/10 text-xs space-y-1">
                    <div className="flex items-center justify-between text-neutral-500 text-[10px] font-mono">
                      <span className="font-semibold text-[#1b1b1b]">{note.author_name || 'Recruiter'}</span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-neutral-700">{note.content}</p>
                  </div>
                ))}
                {candidateNotes.length === 0 && (
                  <p className="text-xs text-neutral-400 font-mono italic">No recruiter notes recorded yet.</p>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            {hasRole(['ADMIN', 'RECRUITER']) && (
              <div className="pt-4 border-t border-black/10 flex justify-between items-center">
                <span className="text-xs text-neutral-500 font-mono">Integrity control</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCandidate(selectedCandidate.id)}
                  className="text-xs font-medium text-red-600 hover:underline flex items-center gap-1 font-mono"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
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
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Target Job Opening *</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="air-input text-xs"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="air-button-light text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={isApplying}
                className="bg-[#1b1b1b] text-white hover:bg-black rounded-lg px-4 py-2 font-medium text-xs disabled:opacity-50"
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
