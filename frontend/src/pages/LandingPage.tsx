import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart2,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  Brain,
  Sliders,
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="h-16 border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-600 shadow-md shadow-primary/20 text-white font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-xl text-foreground">HireLens AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
          <a href="#preview" className="hover:text-foreground transition-colors">Platform Demo</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 lg:px-12 max-w-6xl mx-auto text-center overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary/20 to-violet-600/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Intelligent ATS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
          Smarter Hiring Starts Here.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          HireLens AI empowers recruiting teams with automated resume parsing, explainable multi-factor candidate matching, and interactive hiring pipelines.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login?demo=admin"
            className="px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span>Explore Live Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/register"
            className="px-6 py-3.5 rounded-xl border border-border bg-card/60 backdrop-blur-sm text-foreground font-semibold text-base hover:bg-secondary/70 transition-all"
          >
            Create Organization Account
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Explainable AI Scoring
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Human-in-the-Loop Review
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            PostgreSQL Multi-Tenant Scoping
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            No Paid API Dependencies
          </span>
        </div>
      </section>

      {/* Interactive Platform Preview */}
      <section id="preview" className="px-6 lg:px-12 max-w-6xl mx-auto pb-24 w-full">
        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden p-1.5">
          <div className="rounded-xl border border-border/80 bg-background/90 p-6 lg:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-border gap-4">
              <div>
                <span className="text-xs uppercase font-semibold text-primary tracking-wider">Candidate Ranking Snapshot</span>
                <h3 className="text-xl font-bold text-foreground">Senior Full-Stack Engineer — Applicant Matches</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  Top Match: 94%
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground">
                  6 Applicants Ranked
                </span>
              </div>
            </div>

            {/* Preview Candidate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Maya Lin</h4>
                    <p className="text-xs text-muted-foreground">Lead Full-Stack Developer • 6.5 yrs exp</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 font-bold text-sm font-mono border border-emerald-500/30">
                    94%
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Required Skills Coverage</span>
                    <span className="font-mono font-medium text-foreground">100% (5/5)</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Python</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">FastAPI</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">React</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">PostgreSQL</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">+ Docker</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Devon Miller</h4>
                    <p className="text-xs text-muted-foreground">Senior Backend Engineer • 5.0 yrs exp</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-500 font-bold text-sm font-mono border border-indigo-500/30">
                    81%
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Required Skills Coverage</span>
                    <span className="font-mono font-medium text-foreground">80% (4/5)</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[80%]" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Python</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">FastAPI</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">Missing: TypeScript</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <strong>Ethical AI Guardrail:</strong> Demographic attributes and protected characteristics are strictly excluded from ranking calculations.
              </span>
              <Link to="/login?demo=admin" className="text-primary hover:underline font-semibold flex items-center gap-1">
                Explore in App <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 lg:px-12 max-w-6xl mx-auto border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-semibold text-primary tracking-wider">Engineered for Accuracy</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            Powerful Recruitment Capabilities
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">
            Everything your talent acquisition squad requires to discover, evaluate, and hire top engineering talent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">AI Resume Parser</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Extracts text from PDF and DOCX files using PyMuPDF and python-docx. Detects contact information, technical skills against a comprehensive taxonomy, and work history with reviewer verification.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
            <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl w-fit">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Explainable Matching</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Multi-factor scoring engine evaluating required skills (40%), semantic TF-IDF relevance (30%), preferred skills (15%), and experience alignment (15%) with transparent textual justifications.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl w-fit">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Interactive Kanban Pipeline</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Drag-and-drop candidates through Applied, Screening, Shortlisted, Interview, Offer, and Hired stages. Every transition persists to PostgreSQL with an immutable stage history trail.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Conflict-Free Scheduling</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Coordinate online, phone, or in-person interviews with automatic calendar conflict prevention, timezone handling, meeting links, and structured interviewer scorecards.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Recruitment Analytics</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Recharts dashboards calculating time-to-hire, stage conversion ratios, application volume trends, and score distribution histograms directly from relational database records.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Role-Based Access Control</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enforce enterprise security with Argon2 hashing, short-lived JWT access tokens, rotating refresh cookies, organization-scoped queries, and comprehensive audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 max-w-6xl mx-auto border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-semibold text-primary tracking-wider">Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            How HireLens AI Works
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">
            Five streamlined steps from candidate discovery to offer letter.
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
            <div key={idx} className="p-5 rounded-xl border border-border bg-card/60 space-y-2 relative">
              <span className="font-mono text-2xl font-black text-primary/40">{item.step}</span>
              <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/40 py-10 px-6 lg:px-12 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-foreground">HireLens AI</span>
            <span>— Intelligent Recruitment & Applicant Tracking System</span>
          </div>

          <div className="text-xs text-center md:text-right">
            <p>Author: <strong>Afreen Fasiha</strong></p>
            <p>Purpose: <strong>CodeC Technologies Internship Project</strong></p>
          </div>
        </div>
      </footer>
    </div>
  );
};
