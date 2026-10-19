import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Users,
  Brain,
  Calendar,
  BarChart2,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col selection:bg-white selection:text-black">
      {/* Minimal Top Navigation (72px desktop) */}
      <nav className="h-[72px] border-b border-white/10 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white font-bold font-mono text-sm">
            H
          </div>
          <span className="font-semibold tracking-widest text-base text-white uppercase">HireLens AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#preview" className="hover:text-white transition-colors">Platform Preview</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="air-button-ghost text-sm px-4 py-2"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="air-button-solid-white text-sm px-4 py-2"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Cinematic Full-Viewport Hero with Glass Sculpture Cloud Photography */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 lg:px-12 overflow-hidden">
        {/* Full-bleed atmospheric cloud photography & sculptural translucent glass */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <img
            src="/assets/midnight-glass-sky.jpg"
            alt="Atmospheric midnight sky with sculptural glass"
            className="w-full h-full object-cover opacity-60 mix-blend-screen scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/60 via-[#000000]/20 to-[#000000]" />
        </div>

        <div className="max-w-[1150px] mx-auto w-full py-16 flex flex-col items-center z-10">
          {/* Subtle Category Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-neutral-300 text-xs font-mono uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2b7fff]" />
            <span>Autonomous Intelligence & Ethical ATS</span>
          </div>

          {/* Compressed Display Headline: Anton font with cursive accent */}
          <h1 className="font-display uppercase tracking-tight text-white leading-none text-5xl sm:text-7xl md:text-8xl lg:text-9xl max-w-5xl">
            HIRING, REIMAGINED.
          </h1>

          {/* Handwritten accent word using Caveat */}
          <div className="mt-2 mb-6">
            <span className="font-handwriting text-3xl sm:text-4xl md:text-5xl text-[#ffffff] lowercase italic tracking-wide">
              intelligently
            </span>
          </div>

          <p className="mt-4 text-base sm:text-lg md:text-xl text-neutral-300 max-w-2xl font-normal leading-relaxed">
            A centralized recruitment engine pairing explainable NLP candidate scoring with human-in-the-loop decision support.
          </p>

          {/* Ghost and Solid Air Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login?demo=admin"
              className="air-button-solid-white text-base px-6 py-3"
            >
              <span>Explore Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register"
              className="air-button-ghost text-base px-6 py-3"
            >
              Create Organization Account
            </Link>
          </div>

          {/* Minimal Key Assertions */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-xs text-neutral-400 font-mono uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              Explainable AI Scoring
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              Human-in-the-Loop Review
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              Zero Demographic Bias
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              No Paid API Dependencies
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Platform Preview Container */}
      <section id="preview" className="px-6 lg:px-12 max-w-[1150px] mx-auto py-16 w-full">
        <div className="air-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-black/10 gap-4">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#426188]">Candidate Match Analysis</span>
              <h3 className="text-xl font-bold text-[#1b1b1b] mt-0.5">Staff Full-Stack Engineer — Applicant Ranking</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-semibold font-mono bg-[#2b7fff]/10 text-[#2b7fff] border border-[#2b7fff]/30">
                Top Score: 94%
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-semibold font-mono bg-black/5 text-[#1b1b1b]">
                6 Applicants Evaluated
              </span>
            </div>
          </div>

          {/* Sample Candidates in Off-White Card Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-5 rounded-lg border border-black/10 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1b1b1b] text-sm">Maya Lin</h4>
                  <p className="text-xs text-neutral-500 font-mono">Lead Full-Stack Developer • 6.5 yrs exp</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#2b7fff]/10 text-[#2b7fff] font-bold text-sm font-mono border border-[#2b7fff]/30">
                  94%
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600 font-mono">
                  <span>Required Skills Coverage</span>
                  <span className="font-bold text-[#1b1b1b]">100% (5/5)</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1b1b1b] rounded-full w-full" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">Python</span>
                <span className="px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">FastAPI</span>
                <span className="px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">React</span>
                <span className="px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">PostgreSQL</span>
                <span className="px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">+ Docker</span>
              </div>
            </div>

            <div className="p-5 rounded-lg border border-black/10 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1b1b1b] text-sm">Devon Miller</h4>
                  <p className="text-xs text-neutral-500 font-mono">Senior Backend Engineer • 5.0 yrs exp</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-black/10 text-[#1b1b1b] font-bold text-sm font-mono border border-black/20">
                  81%
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600 font-mono">
                  <span>Required Skills Coverage</span>
                  <span className="font-bold text-[#1b1b1b]">80% (4/5)</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#426188] rounded-full w-[80%]" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">Python</span>
                <span className="px-2 py-0.5 rounded bg-black/5 text-[#1b1b1b] border border-black/10">FastAPI</span>
                <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-300">Missing: TypeScript</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-black/5 border border-black/10 text-xs text-neutral-600 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1b1b1b]" />
              <strong>Ethical Notice:</strong> AI scores provide explainable advisory ranking and never automate rejection.
            </span>
            <Link to="/login?demo=admin" className="text-[#2b7fff] hover:underline font-semibold flex items-center gap-1 font-mono">
              Launch App <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Core Recruitment Capabilities Grid */}
      <section id="features" className="py-20 px-6 lg:px-12 max-w-[1150px] mx-auto border-t border-white/10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-mono tracking-widest text-[#2b7fff]">Precision Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
            Engineered for Modern Talent Teams
          </h2>
          <p className="mt-3 text-neutral-400 text-sm">
            Everything your talent acquisition squad requires to discover, evaluate, and hire top engineering talent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="air-card flex flex-col justify-between space-y-3">
            <div>
              <div className="p-2.5 bg-black/[0.06] text-[#1b1b1b] rounded-lg w-fit mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1b1b1b]">AI Resume Parser</h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Extracts text from PDF and DOCX files using PyMuPDF and python-docx. Normalizes skills against a verified taxonomy with human reviewer verification.
              </p>
            </div>
          </div>

          <div className="air-card flex flex-col justify-between space-y-3">
            <div>
              <div className="p-2.5 bg-black/[0.06] text-[#1b1b1b] rounded-lg w-fit mb-3">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1b1b1b]">Explainable Matching</h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Multi-factor scoring evaluating required skills (40%), TF-IDF semantic relevance (30%), preferred skills (15%), and experience alignment (15%) with textual rationales.
              </p>
            </div>
          </div>

          <div className="air-card flex flex-col justify-between space-y-3">
            <div>
              <div className="p-2.5 bg-black/[0.06] text-[#1b1b1b] rounded-lg w-fit mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1b1b1b]">Interactive Pipeline</h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Drag-and-drop candidates through Applied, Screening, Shortlisted, Interview, Offer, and Hired stages with full PostgreSQL audit history.
              </p>
            </div>
          </div>

          <div className="air-card flex flex-col justify-between space-y-3">
            <div>
              <div className="p-2.5 bg-black/[0.06] text-[#1b1b1b] rounded-lg w-fit mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1b1b1b]">Conflict-Free Scheduling</h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Coordinate online, phone, or in-person interviews with calendar conflict validation, meeting links, and structured scorecards.
              </p>
            </div>
          </div>

          <div className="air-card flex flex-col justify-between space-y-3">
            <div>
              <div className="p-2.5 bg-black/[0.06] text-[#1b1b1b] rounded-lg w-fit mb-3">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1b1b1b]">Recruitment Analytics</h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Relational metrics calculating time-to-hire, stage conversion ratios, application volume trends, and score distribution histograms.
              </p>
            </div>
          </div>

          <div className="air-card flex flex-col justify-between space-y-3">
            <div>
              <div className="p-2.5 bg-black/[0.06] text-[#1b1b1b] rounded-lg w-fit mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1b1b1b]">Role-Based Access Control</h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Enterprise security with Argon2 hashing, short-lived JWT access tokens, rotating refresh cookies, organization-scoped queries, and audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 max-w-[1150px] mx-auto border-t border-white/10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-mono tracking-widest text-[#2b7fff]">Recruitment Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
            Five Steps to Hired
          </h2>
          <p className="mt-3 text-neutral-400 text-sm">
            From job requirement formulation to offer acceptance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Create Job', desc: 'Define required skills, preferred qualifications, and experience expectations.' },
            { step: '02', title: 'Upload Resume', desc: 'Securely upload candidate PDF or DOCX files for document validation.' },
            { step: '03', title: 'AI Extraction', desc: 'Extract contact details and normalize technical skills against taxonomy.' },
            { step: '04', title: 'Score & Match', desc: 'Review explainable match scores, identify missing skills, and rank candidates.' },
            { step: '05', title: 'Interview & Hire', desc: 'Advance through Kanban stages, schedule interviews, and capture feedback.' },
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-lg border border-white/15 bg-white/[0.02] space-y-2">
              <span className="font-mono text-2xl font-bold text-white/30">{item.step}</span>
              <h4 className="font-semibold text-white text-sm">{item.title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="architecture" className="mt-auto border-t border-white/10 bg-[#000000] py-12 px-6 lg:px-12 text-sm text-neutral-400">
        <div className="max-w-[1150px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-black font-bold text-xs">
              H
            </div>
            <span className="font-semibold text-white">HireLens AI</span>
            <span className="text-xs text-neutral-500">— Air Design System Edition</span>
          </div>

          <div className="text-xs text-center md:text-right font-mono">
            <p>Author: <strong className="text-white">Afreen Fasiha</strong></p>
            <p>Purpose: <strong className="text-white">CodeC Technologies Internship Project</strong></p>
          </div>
        </div>
      </footer>
    </div>
  );
};
