import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, Plus, X } from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../services/api';
import type { ParsedResumeData } from '../types';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (candidate: any) => void;
  candidateId?: string; // If uploading to an existing candidate
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  candidateId
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [newSkill, setNewSkill] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form state for reviewer adjustments
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    current_title: '',
    experience_years: 0,
    education_level: "Bachelor's Degree",
    skills: [] as string[]
  });

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx')) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsParsing(true);

    try {
      const parsed = await api.ai.parseResumePreview(selectedFile);
      setParsedData(parsed);
      setFormData({
        full_name: parsed.full_name || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        current_title: parsed.current_title || '',
        experience_years: parsed.experience_years || 1,
        education_level: parsed.education_level || "Bachelor's Degree",
        skills: parsed.skills || []
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse resume text. Please fill details manually.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSaveAuthoritative = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError('Candidate full name and email are required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let cand;
      if (candidateId) {
        cand = await api.candidates.update(candidateId, {
          ...formData,
          is_verified_by_recruiter: true
        });
        if (file) {
          await api.candidates.uploadResume(candidateId, file);
        }
      } else {
        cand = await api.candidates.create({
          ...formData,
          is_verified_by_recruiter: true
        });
        if (file && cand.id) {
          await api.candidates.uploadResume(cand.id, file);
        }
      }

      onSuccess(cand);
      handleReset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save candidate. Please verify your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      location: '',
      current_title: '',
      experience_years: 0,
      education_level: "Bachelor's Degree",
      skills: []
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Upload & Parse Candidate Resume"
      subtitle="AI extracts contact info, technical skills, and experience with human reviewer verification."
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Zone */}
        {!file && (
          <label className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors bg-secondary/30">
            <div className="p-3 bg-primary/10 rounded-full text-primary mb-3">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">PDF or DOCX documents (up to 10MB)</p>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
          </label>
        )}

        {/* Parsing Progress */}
        {isParsing && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div>
              <p className="text-sm font-semibold text-foreground">Extracting resume text & skills...</p>
              <p className="text-xs text-muted-foreground">Running NLP entity normalization and taxonomy checks</p>
            </div>
          </div>
        )}

        {/* Review & Verification Step */}
        {file && !isParsing && parsedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-rose-500 font-medium"
              >
                Change File
              </button>
            </div>

            {parsedData.uncertain_fields && parsedData.uncertain_fields.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Review Notice:</strong> Please verify {parsedData.uncertain_fields.join(', ')} before saving.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. Maya Lin"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. maya@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="+1 (555) 0123"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Current Job Title</label>
                <input
                  type="text"
                  value={formData.current_title}
                  onChange={e => setFormData({ ...formData, current_title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Years of Experience</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.experience_years}
                  onChange={e => setFormData({ ...formData, experience_years: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Education Level</label>
                <input
                  type="text"
                  value={formData.education_level}
                  onChange={e => setFormData({ ...formData, education_level: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. Bachelor's Degree"
                />
              </div>
            </div>

            {/* Extracted Skills */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Extracted Skills ({formData.skills.length})
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-border bg-secondary/20 min-h-[50px] mb-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-rose-500 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Add another skill..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-foreground hover:bg-secondary/80 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAuthoritative}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Verify & Save Candidate</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
