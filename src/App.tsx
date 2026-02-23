/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  FileText, 
  Download, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Briefcase, 
  GraduationCap, 
  Award,
  Trash2,
  Plus,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface Skill {
  name: string;
  type: 'technical' | 'soft';
  proficiency: number; // 0-100
}

interface AnalysisResult {
  id: string;
  timestamp: number;
  candidateName: string;
  jobRole: string;
  score: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
  };
  skills: Skill[];
  experience: {
    years: number;
    relevance: number; // 0-100
    summary: string;
  };
  education: {
    degrees: string[];
    certifications: string[];
  };
  recommendations: string[];
  rawText: string;
}

interface JobRoleConfig {
  id: string;
  title: string;
  keywords: string[];
  softSkills: string[];
  minYears: number;
}

// --- Constants & Mock Data ---

const JOB_ROLES: JobRoleConfig[] = [
  {
    id: 'frontend',
    title: 'Frontend Developer',
    keywords: ['React', 'TypeScript', 'Tailwind', 'Next.js', 'Vite', 'CSS', 'HTML', 'JavaScript', 'Redux', 'Testing Library'],
    softSkills: ['Communication', 'Teamwork', 'Problem Solving', 'Agile'],
    minYears: 3
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    keywords: ['Python', 'R', 'SQL', 'Machine Learning', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Statistics'],
    softSkills: ['Analytical Thinking', 'Data Storytelling', 'Curiosity'],
    minYears: 2
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    keywords: ['Roadmap', 'Agile', 'Scrum', 'User Stories', 'Stakeholder Management', 'Market Research', 'KPIs', 'Product Discovery'],
    softSkills: ['Leadership', 'Strategic Thinking', 'Empathy', 'Negotiation'],
    minYears: 5
  },
  {
    id: 'ux-designer',
    title: 'UX Designer',
    keywords: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Accessibility', 'Interaction Design'],
    softSkills: ['Creativity', 'User Centricity', 'Collaboration'],
    minYears: 3
  }
];

const SAMPLE_RESUME = `Alex Johnson
alex.johnson@email.com | 555-0123 | San Francisco, CA

SUMMARY
Experienced Frontend Developer with 4 years of expertise in building scalable web applications using React and TypeScript. Passionate about clean code and user-centric design.

EXPERIENCE
Senior Frontend Engineer | TechFlow Solutions | 2021 - Present
- Led the migration of a legacy dashboard to Next.js, improving load times by 40%.
- Implemented a comprehensive design system using Tailwind CSS.
- Mentored junior developers and conducted code reviews.

Web Developer | Creative Pulse | 2019 - 2021
- Developed responsive websites for various clients using JavaScript and CSS.
- Collaborated with UX designers to implement pixel-perfect interfaces.

EDUCATION
B.S. in Computer Science | University of California, Berkeley | 2015 - 2019

SKILLS
Technical: React, TypeScript, Next.js, Tailwind CSS, Redux, Jest, HTML5, CSS3, Git
Soft: Communication, Teamwork, Problem Solving, Agile Methodologies`;

// --- Analysis Logic (Mock AI) ---

const analyzeResume = (text: string, roleId: string): AnalysisResult => {
  const role = JOB_ROLES.find(r => r.id === roleId) || JOB_ROLES[0];
  const normalizedText = text.toLowerCase();
  
  // Extract Name (Simple mock extraction)
  const nameMatch = text.split('\n')[0].trim();
  const candidateName = nameMatch.length < 50 ? nameMatch : "Unknown Candidate";

  // Skills Analysis
  const foundTechSkills = role.keywords.filter(k => normalizedText.includes(k.toLowerCase()));
  const foundSoftSkills = role.softSkills.filter(k => normalizedText.includes(k.toLowerCase()));
  
  const skills: Skill[] = [
    ...foundTechSkills.map(s => ({ name: s, type: 'technical' as const, proficiency: Math.floor(Math.random() * 30) + 70 })),
    ...foundSoftSkills.map(s => ({ name: s, type: 'soft' as const, proficiency: Math.floor(Math.random() * 20) + 80 }))
  ];

  // Experience Analysis
  const yearMatches = text.match(/\d+\s+years?/gi);
  let years = 0;
  if (yearMatches) {
    years = Math.max(...yearMatches.map(m => parseInt(m.split(' ')[0])));
  } else {
    // Fallback: count date ranges
    const dateRanges = text.match(/\d{4}\s*-\s*(\d{4}|Present)/gi);
    if (dateRanges) {
      years = dateRanges.length * 2; // Rough estimate
    }
  }
  
  const experienceRelevance = Math.min(100, (years / role.minYears) * 100);

  // Education Analysis
  const degrees = ['B.S.', 'M.S.', 'Ph.D.', 'Bachelor', 'Master', 'Degree'].filter(d => text.includes(d));
  const certifications = ['AWS', 'Google', 'Certified', 'Certificate'].filter(c => text.includes(c));

  // Scoring
  const skillsScore = (foundTechSkills.length / role.keywords.length) * 100;
  const softSkillsScore = (foundSoftSkills.length / role.softSkills.length) * 100;
  const educationScore = degrees.length > 0 ? 100 : 50;
  
  const overallScore = Math.floor((skillsScore * 0.5) + (experienceRelevance * 0.3) + (educationScore * 0.2));

  // Recommendations
  const recommendations = [
    foundTechSkills.length < role.keywords.length / 2 ? `Add more technical keywords like ${role.keywords.filter(k => !foundTechSkills.includes(k)).slice(0, 2).join(', ')}.` : "Great technical keyword density.",
    years < role.minYears ? `Highlight more relevant projects to compensate for ${years} years of experience (target: ${role.minYears}+).` : "Experience level meets or exceeds role requirements.",
    !normalizedText.includes('certification') ? "Consider adding industry-recognized certifications to boost credibility." : "Good certification profile.",
    foundSoftSkills.length < 2 ? "Elaborate more on soft skills like leadership or communication in your experience section." : "Soft skills are well-represented.",
    "Quantify your achievements with more metrics (e.g., 'increased revenue by 20%').",
    "Ensure your summary section directly aligns with the specific job description."
  ];

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    candidateName,
    jobRole: role.title,
    score: overallScore,
    breakdown: {
      skills: Math.floor((skillsScore + softSkillsScore) / 2),
      experience: Math.floor(experienceRelevance),
      education: educationScore
    },
    skills,
    experience: {
      years,
      relevance: Math.floor(experienceRelevance),
      summary: `${years} years of experience in related fields.`
    },
    education: {
      degrees,
      certifications
    },
    recommendations,
    rawText: text
  };
};

// --- Components ---

const ScoreGauge = ({ score }: { score: number }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];
  
  const COLORS = [
    score > 80 ? '#10b981' : score > 60 ? '#f59e0b' : '#ef4444',
    '#e2e8f0'
  ];

  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-4 text-center">
        <span className="text-4xl font-bold" style={{ color: COLORS[0] }}>{score}%</span>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Suitability</p>
      </div>
    </div>
  );
};

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [selectedRole, setSelectedRole] = useState(JOB_ROLES[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  // Load history from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('talent_scan_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to session storage
  useEffect(() => {
    sessionStorage.setItem('talent_scan_history', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = () => {
    if (!resumeText.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const result = analyzeResume(resumeText, selectedRole);
      setCurrentResult(result);
      setHistory(prev => [result, ...prev].slice(0, 10));
      setIsAnalyzing(false);
    }, 1500);
  };

  const loadSample = () => {
    setResumeText(SAMPLE_RESUME);
    setSelectedRole('frontend');
  };

  const downloadReport = () => {
    if (!currentResult) return;
    
    const doc = new jsPDF();
    const r = currentResult;
    
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text("TalentScan AI - Analysis Report", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Candidate: ${r.candidateName}`, 20, 35);
    doc.text(`Role: ${r.jobRole}`, 20, 42);
    doc.text(`Date: ${new Date(r.timestamp).toLocaleDateString()}`, 20, 49);
    doc.text(`Overall Suitability Score: ${r.score}%`, 20, 56);
    
    doc.setFontSize(16);
    doc.text("Skills Analysis", 20, 70);
    doc.setFontSize(10);
    r.skills.forEach((s, i) => {
      doc.text(`• ${s.name} (${s.type}): ${s.proficiency}%`, 25, 78 + (i * 6));
    });
    
    const nextY = 85 + (r.skills.length * 6);
    doc.setFontSize(16);
    doc.text("Recommendations", 20, nextY);
    doc.setFontSize(10);
    r.recommendations.forEach((rec, i) => {
      doc.text(`- ${rec}`, 25, nextY + 8 + (i * 6));
    });
    
    doc.save(`${r.candidateName.replace(/\s+/g, '_')}_Analysis.pdf`);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">TalentScan <span className="text-emerald-600">AI</span></h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Next-Gen Recruitment</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <a href="#" className="text-emerald-600">Dashboard</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Analytics</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Settings</a>
            </nav>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                <History size={16} />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">Recruiter Pro</p>
                <p className="text-[10px] text-slate-400">Enterprise Plan</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & History */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Input Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="text-emerald-600" size={20} />
                  <h2 className="font-bold text-slate-800">New Analysis</h2>
                </div>
                <button 
                  onClick={loadSample}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Load Sample
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Job Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {JOB_ROLES.map(role => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                          "px-3 py-2 text-sm rounded-xl border transition-all text-left flex items-center justify-between group",
                          selectedRole === role.id 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {role.title}
                        {selectedRole === role.id && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resume Content</label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste candidate resume text here..."
                    className="w-full h-64 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm resize-none font-mono bg-slate-50/30"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !resumeText.trim()}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                    isAnalyzing || !resumeText.trim()
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 active:scale-[0.98]"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Run Analysis
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* History Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="text-slate-400" size={20} />
                  <h2 className="font-bold text-slate-800">Recent History</h2>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                  {history.length} / 10
                </span>
              </div>
              
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-12 text-center">
                    <History size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400">No previous analyses found.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setCurrentResult(item)}
                      className={cn(
                        "p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group",
                        currentResult?.id === item.id ? "bg-emerald-50/50" : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                          item.score > 80 ? "bg-emerald-100 text-emerald-700" : item.score > 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>
                          {item.score}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{item.candidateName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.jobRole} • {new Date(item.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Dashboard */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!currentResult ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Search size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ready for Analysis</h3>
                  <p className="text-slate-500 max-w-sm mb-8">
                    Paste a resume and select a role to generate a comprehensive AI analysis report.
                  </p>
                  <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                    {[
                      { icon: <TrendingUp size={18} />, label: "Scoring" },
                      { icon: <Award size={18} />, label: "Skills" },
                      { icon: <Briefcase size={18} />, label: "Experience" }
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 flex flex-col items-center gap-2">
                        <div className="text-emerald-500">{item.icon}</div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Result Header */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <FileText size={32} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{currentResult.candidateName}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <Briefcase size={14} />
                          <span>{currentResult.jobRole}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span>Analyzed {new Date(currentResult.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={downloadReport}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={16} /> Export PDF
                      </button>
                      <button className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                        Shortlist <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Score Gauge Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <TrendingUp size={18} className="text-emerald-500" />
                          Suitability Score
                        </h3>
                        <Info size={14} className="text-slate-300 cursor-help" />
                      </div>
                      <ScoreGauge score={currentResult.score} />
                      <div className="mt-4 space-y-3">
                        {Object.entries(currentResult.breakdown).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              <span>{key}</span>
                              <span>{value}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                className={cn(
                                  "h-full rounded-full",
                                  key === 'skills' ? "bg-emerald-500" : key === 'experience' ? "bg-blue-500" : "bg-purple-500"
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Experience Summary Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Briefcase size={18} className="text-blue-500" />
                        Experience & Education
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <History size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Experience</p>
                            <p className="text-lg font-bold text-slate-800">{currentResult.experience.years} Years</p>
                            <p className="text-xs text-slate-500">{currentResult.experience.summary}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                            <GraduationCap size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Education</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentResult.education.degrees.length > 0 ? (
                                currentResult.education.degrees.map((d, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold">{d}</span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 italic">No degrees detected</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {currentResult.education.certifications.map((c, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">{c}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills Inventory */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Award size={18} className="text-amber-500" />
                      Skills Inventory
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {currentResult.skills.map((skill, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              skill.type === 'technical' ? "bg-emerald-400" : "bg-blue-400"
                            )} />
                            <span className="text-sm font-medium text-slate-700">{skill.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  skill.proficiency > 90 ? "bg-emerald-500" : skill.proficiency > 80 ? "bg-emerald-400" : "bg-emerald-300"
                                )}
                                style={{ width: `${skill.proficiency}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 w-8">{skill.proficiency}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <AlertCircle size={18} className="text-red-500" />
                      Actionable Recommendations
                    </h3>
                    <div className="space-y-3">
                      {currentResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                          <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-600 shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="h-[1px] w-full bg-slate-200 mb-8" />
        <p className="text-slate-400 text-sm">
          &copy; 2026 TalentScan AI. Powered by Advanced Keyword Matching & Heuristics.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
          <span className="w-1 h-1 bg-slate-200 rounded-full" />
          <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
          <span className="w-1 h-1 bg-slate-200 rounded-full" />
          <a href="#" className="hover:text-emerald-500 transition-colors">API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
