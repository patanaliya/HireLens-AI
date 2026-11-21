import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import '../App.css'

export default function ResumeScreener() {
  // Navigation / Mode state
  const [blindMode, setBlindMode] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'shortlisted' | 'top_matches'
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [jobTitle, setJobTitle] = useState('Senior Full-Stack Engineer')
  const [minExp, setMinExp] = useState(3)
  const [skillsList, setSkillsList] = useState(['Python', 'FastAPI', 'React', 'Docker', 'PostgreSQL'])
  const [newSkillInput, setNewSkillInput] = useState('')
  const [jobDescription, setJobDescription] = useState(
    'We are seeking a Senior Full-Stack Engineer with 3+ years of experience to design and build high-throughput microservices using Python, FastAPI, React, Docker, and PostgreSQL. Experience with cloud deployments and REST APIs is highly valued.'
  )
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [includeBenchmarks, setIncludeBenchmarks] = useState(true)

  // Status & Results
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false)
  const [isScreening, setIsScreening] = useState(false)
  const [screeningProgress, setScreeningProgress] = useState('')
  const [jdAnalysisData, setJdAnalysisData] = useState(null)
  const [rankedCandidates, setRankedCandidates] = useState([])
  const [hasScreened, setHasScreened] = useState(false)
  const [error, setError] = useState('')
  const [expandedEvidenceId, setExpandedEvidenceId] = useState(null)

  // Sample Presets
  const presets = {
    fullstack: {
      title: 'Senior Full-Stack Developer',
      exp: 3,
      skills: ['Python', 'FastAPI', 'React', 'Docker', 'PostgreSQL', 'Redis'],
      jd: 'Looking for an experienced Senior Full-Stack Developer proficient in Python, FastAPI, React, Docker, and PostgreSQL to scale microservices and responsive web applications handling high transaction volumes.'
    },
    devops: {
      title: 'Cloud & DevOps Engineer',
      exp: 4,
      skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Python', 'Linux', 'Git'],
      jd: 'Seeking a Cloud DevOps Engineer with 4+ years of experience in container orchestration with Kubernetes, Docker, AWS infrastructure, automated CI/CD pipelines, and infrastructure as code.'
    },
    datascience: {
      title: 'AI / Data Engineer',
      exp: 3,
      skills: ['Python', 'SQL', 'PostgreSQL', 'NLP', 'PyTorch', 'FastAPI', 'Docker'],
      jd: 'Seeking a talented AI & Data Engineer with experience in Python, NLP, PyTorch, SQL data modeling, and FastAPI to productionize machine learning models and large-scale data pipelines.'
    }
  }

  const applyPreset = (key) => {
    const p = presets[key]
    if (!p) return
    setJobTitle(p.title)
    setMinExp(p.exp)
    setSkillsList(p.skills)
    setJobDescription(p.jd)
    setJdAnalysisData(null)
  }

  const handleAddSkill = (e) => {
    e.preventDefault()
    const trimmed = newSkillInput.trim()
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed])
      setNewSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove))
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...selected])
  }

  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== index))
  }

  // 1-Click Load Sample Demo Resumes
  const loadBenchmarkResumes = () => {
    setIncludeBenchmarks(true)
    setError('')
  }

  // Auto-extract JD skills and check bias
  const handleAnalyzeJD = async () => {
    if (!jobDescription.trim()) return
    setIsAnalyzingJD(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/extract-jd-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jobDescription })
      })
      if (!res.ok) throw new Error('Failed to analyze job description.')
      const data = await res.json()
      setJdAnalysisData(data)
      if (data.extracted_skills && data.extracted_skills.length > 0) {
        setSkillsList(data.extracted_skills)
      }
      if (data.suggested_title) {
        setJobTitle(data.suggested_title)
      }
      if (data.min_experience) {
        setMinExp(data.min_experience)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAnalyzingJD(false)
    }
  }

  // Run AI Resume Screening
  const handleRunScreening = async () => {
    setIsScreening(true)
    setError('')
    setScreeningProgress('1. Parsing resume text (PDF / DOCX)...')

    try {
      const formData = new FormData()
      uploadedFiles.forEach(file => {
        formData.append('files', file)
      })
      formData.append('job_title', jobTitle)
      formData.append('job_description', jobDescription)
      formData.append('required_skills', skillsList.join(', '))
      formData.append('min_experience', minExp.toString())
      formData.append('blind_mode', blindMode.toString())
      formData.append('include_benchmarks', includeBenchmarks.toString())

      setTimeout(() => setScreeningProgress('2. Extracting technical skills & NLP graph mapping...'), 400)
      setTimeout(() => setScreeningProgress('3. Computing experience relevance & missing gaps...'), 800)
      setTimeout(() => setScreeningProgress('4. Generating explainable AI recommendations...'), 1200)

      const response = await fetch(`${API_BASE}/api/screen-resumes`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Screening failed. Please make sure the backend server is running.')
      }

      const result = await response.json()
      setRankedCandidates(result.ranked_candidates || [])
      setHasScreened(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsScreening(false)
      setScreeningProgress('')
    }
  }

  // Toggle Shortlist
  const handleToggleShortlist = async (candidateId) => {
    // Optimistic local update
    setRankedCandidates(prev =>
      prev.map(c => c.id === candidateId ? { ...c, is_shortlisted: !c.is_shortlisted } : c)
    )

    try {
      await fetch(`${API_BASE}/api/candidates/${candidateId}/toggle-shortlist`, {
        method: 'POST'
      })
    } catch (err) {
      console.warn('Shortlist persistence warning:', err)
    }
  }

  // Filter candidates
  const filteredCandidates = rankedCandidates.filter(c => {
    const matchesSearch =
      (c.candidate_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.headline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.matched_skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    if (activeTab === 'shortlisted') return c.is_shortlisted
    if (activeTab === 'top_matches') return c.overall_score >= 80

    return true
  })

  // Export Shortlist CSV
  const handleExportShortlist = () => {
    const listToExport = rankedCandidates.filter(c => c.is_shortlisted)
    if (listToExport.length === 0) {
      alert('Please shortlist at least one candidate before exporting.')
      return
    }
    const headers = 'Rank,Candidate Name,Score,Headline,Experience,Education,Matched Skills,Missing Skills\n'
    const rows = listToExport.map(c =>
      `"${c.rank}","${c.candidate_name}","${c.overall_score}%","${c.headline}","${c.experience_years} yrs","${c.education}","${(c.matched_skills || []).join('; ')}","${(c.missing_skills || []).join('; ')}"`
    ).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `HireLens_Shortlist_${jobTitle.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Auto-run screening on initial load so page is never empty
  useEffect(() => {
    handleRunScreening()
  }, [blindMode])

  const shortlistedCount = rankedCandidates.filter(c => c.is_shortlisted).length
  const topMatchCount = rankedCandidates.filter(c => c.overall_score >= 80).length

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>

      {/* Top Navbar */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '1.4rem', fontWeight: 800, textDecoration: 'none', color: '#1e293b' }}>
          HireLens <span style={{ color: '#2563eb' }}>AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Home</Link>
          <Link to="/screen" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>AI Screener & Ranker ✨</Link>
          <Link to="/candidates" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Candidate Directory</Link>
          <Link to="/what-if" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>What-If Simulator 🎚️</Link>
          <Link to="/jd-bias" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>JD Bias Analyzer ⚖️</Link>

          {/* Blind Screening Toggle */}
          <button
            onClick={() => setBlindMode(!blindMode)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: blindMode ? '#059669' : '#cbd5e1',
              background: blindMode ? '#ecfdf5' : '#ffffff',
              color: blindMode ? '#047857' : '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {blindMode ? '🛡️ Blind Mode: ON' : '👁️ Blind Mode: OFF'}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '36px 8% 80px' }}>

        {/* Header Banner */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px' }}>
            STEP-BY-STEP RECRUITMENT WORKSPACE
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            AI Resume Screening & Candidate Ranking System
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '850px' }}>
            Upload multiple candidate resumes, define your job description, and let explainable AI rank candidates by skills, experience, and verified evidence — complete with missing skill detection and shortlist workflows.
          </p>
        </div>

        {/* Step Progression Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '36px' }}>
          {[
            { step: '1', title: 'Upload Resumes', desc: 'PDF, DOCX, or Pre-loaded' },
            { step: '2', title: 'Job Description', desc: 'Skills & Experience Scope' },
            { step: '3', title: 'AI Semantic Analysis', desc: 'NLP & Graph Matching' },
            { step: '4', title: 'Ranked Shortlist', desc: 'Explainable AI Decision' }
          ].map((item, idx) => (
            <div
              key={item.step}
              style={{
                background: idx <= 2 ? '#ffffff' : '#f1f5f9',
                border: '1px solid',
                borderColor: idx <= 2 ? '#2563eb' : '#e2e8f0',
                padding: '14px 18px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: idx <= 2 ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}>
                {item.step}
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>{item.title}</strong>
                <small style={{ color: '#64748b', fontSize: '0.78rem' }}>{item.desc}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Top Two Columns: 1. Resume Upload | 2. Job Description Input */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '36px' }}>

          {/* LEFT: Resume Upload Box */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', letterSpacing: '1px' }}>STEP 1</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0' }}>Upload Candidate Resumes</h3>
              </div>
              <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                {uploadedFiles.length} file(s) attached
              </span>
            </div>

            {/* Drag and drop upload area */}
            <label style={{
              border: '2px dashed #93c5fd',
              background: '#eff6ff',
              borderRadius: '12px',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'background 0.2s'
            }}>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</span>
              <strong style={{ color: '#1e40af', fontSize: '0.95rem' }}>Click or Drag & Drop Multiple Resumes</strong>
              <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>Supports PDF, DOCX, TXT (up to 5MB each)</small>
            </label>

            {/* Attached file chips */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginBottom: '16px', maxHeight: '130px', overflowY: 'auto' }}>
                <small style={{ fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Selected Resume Files:</small>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {uploadedFiles.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        📎 {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Benchmark Candidates Toggle */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Include 4 Benchmark Database Candidates</strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Priya (Full-Stack), Rohan (DevOps), Ananya (Frontend), Vikram (ML)</p>
              </div>
              <input
                type="checkbox"
                checked={includeBenchmarks}
                onChange={e => setIncludeBenchmarks(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* RIGHT: Job Description Input Box */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', letterSpacing: '1px' }}>STEP 2</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0' }}>Job Requirements & Description</h3>
              </div>
              {/* Presets */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => applyPreset('fullstack')}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}
                >
                  Full-Stack
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('devops')}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}
                >
                  DevOps
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('datascience')}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}
                >
                  AI / Data
                </button>
              </div>
            </div>

            {/* Job Title & Experience */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Min Exp (Yrs)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={minExp}
                  onChange={e => setMinExp(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* Required Skills Chips */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Required Skills ({skillsList.length})
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                {skillsList.map(skill => (
                  <span
                    key={skill}
                    style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Add skill (e.g. AWS, GraphQL)..."
                  value={newSkillInput}
                  onChange={e => setNewSkillInput(e.target.value)}
                  style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
                <button
                  type="submit"
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem' }}
                >
                  + Add
                </button>
              </form>
            </div>

            {/* Job Description Text Area */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Job Description Text</label>
                <button
                  type="button"
                  onClick={handleAnalyzeJD}
                  disabled={isAnalyzingJD}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  {isAnalyzingJD ? 'Analyzing...' : '✨ Auto-Extract Skills & Check Bias'}
                </button>
              </div>
              <textarea
                rows="3"
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste your full job description here..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            {/* Bias Analysis Alert if flagged */}
            {jdAnalysisData?.bias_analysis?.flagged_count > 0 && (
              <div style={{ marginTop: '8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#92400e' }}>
                ⚖️ <strong>Bias Alert:</strong> Flagged {jdAnalysisData.bias_analysis.flagged_count} non-inclusive phrase(s): {jdAnalysisData.bias_analysis.flagged_terms.map(t => `"${t.original}"`).join(', ')}.
                Suggested: {jdAnalysisData.bias_analysis.flagged_terms.map(t => `"${t.suggestion}"`).join(', ')}.
              </div>
            )}
          </div>

        </div>

        {/* Action Button: Run AI Resume Screening */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button
            onClick={handleRunScreening}
            disabled={isScreening}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 48px',
              fontSize: '1.1rem',
              fontWeight: 800,
              cursor: isScreening ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'transform 0.2s'
            }}
          >
            <span>{isScreening ? '⏳' : '🚀'}</span>
            <span>{isScreening ? 'Analyzing Resumes...' : 'Run AI Resume Screening & Candidate Ranking'}</span>
          </button>

          {isScreening && (
            <div style={{ marginTop: '12px', color: '#2563eb', fontWeight: 600, fontSize: '0.9rem' }}>
              {screeningProgress}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '12px', color: '#dc2626', fontWeight: 600, fontSize: '0.9rem' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ========================================================
            STEP 4 & 5: AI RESULTS & RANKED CANDIDATES LEADERBOARD
           ======================================================== */}
        <section id="ranked-results" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>

          {/* Results Summary Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '24px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', letterSpacing: '1px' }}>
                AI SCREENING RESULTS
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 2px' }}>
                Ranked Candidates ({rankedCandidates.length})
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Evaluated against <strong>{jobTitle}</strong> ({skillsList.length} required skills, {minExp}+ yrs experience)
              </p>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 18px', textAlign: 'center' }}>
                <small style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>SHORTLISTED</small>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb' }}>{shortlistedCount}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 18px', textAlign: 'center' }}>
                <small style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>TOP MATCHES (80%+)</small>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>{topMatchCount}</div>
              </div>
              <button
                onClick={handleExportShortlist}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📥 Export Shortlist CSV
              </button>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'all' ? '#2563eb' : '#f1f5f9',
                  color: activeTab === 'all' ? '#fff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                All Ranked ({rankedCandidates.length})
              </button>
              <button
                onClick={() => setActiveTab('shortlisted')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'shortlisted' ? '#2563eb' : '#f1f5f9',
                  color: activeTab === 'shortlisted' ? '#fff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ★ Shortlisted Only ({shortlistedCount})
              </button>
              <button
                onClick={() => setActiveTab('top_matches')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'top_matches' ? '#2563eb' : '#f1f5f9',
                  color: activeTab === 'top_matches' ? '#fff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🏆 Top Matches (80%+)
              </button>
            </div>

            <input
              type="search"
              placeholder="Search candidate name or skill..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: '260px' }}
            />
          </div>

          {/* Candidate Ranked Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredCandidates.map(candidate => {
              const isTop = candidate.rank === 1
              const scoreColor =
                candidate.overall_score >= 80 ? '#059669' : candidate.overall_score >= 65 ? '#2563eb' : '#d97706'
              const scoreBg =
                candidate.overall_score >= 80 ? '#ecfdf5' : candidate.overall_score >= 65 ? '#eff6ff' : '#fffbeb'

              return (
                <div
                  key={candidate.id}
                  style={{
                    border: '1px solid',
                    borderColor: isTop ? '#93c5fd' : '#e2e8f0',
                    borderRadius: '16px',
                    padding: '24px',
                    background: isTop ? '#f8faff' : '#ffffff',
                    position: 'relative',
                    boxShadow: isTop ? '0 8px 25px rgba(37, 99, 235, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Top Badge: Rank and Shortlist Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: isTop ? '#2563eb' : '#334155',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 800
                      }}>
                        #{candidate.rank} {isTop ? 'TOP MATCH 🥇' : candidate.rank === 2 ? 'STRONG FIT 🥈' : 'MATCH'}
                      </span>
                      {candidate.is_uploaded && (
                        <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                          📎 Uploaded File
                        </span>
                      )}
                      {blindMode && (
                        <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                          🛡️ PII Masked
                        </span>
                      )}
                    </div>

                    {/* Shortlist Toggle */}
                    <button
                      onClick={() => handleToggleShortlist(candidate.id)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: candidate.is_shortlisted ? '#059669' : '#cbd5e1',
                        background: candidate.is_shortlisted ? '#ecfdf5' : '#ffffff',
                        color: candidate.is_shortlisted ? '#047857' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{candidate.is_shortlisted ? '✓ Shortlisted' : '★ Shortlist Candidate'}</span>
                    </button>
                  </div>

                  {/* Candidate Header Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '20px', alignItems: 'center', marginBottom: '18px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: blindMode ? '#334155' : isTop ? '#2563eb' : '#e2e8f0',
                      color: blindMode || isTop ? '#ffffff' : '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800
                    }}>
                      {blindMode ? '🛡️' : (candidate.candidate_name || 'C').charAt(0).toUpperCase()}
                    </div>

                    {/* Name & Headline */}
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                        {candidate.candidate_name}
                      </h3>
                      <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 6px' }}>
                        {candidate.headline}
                      </p>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: '#64748b' }}>
                        <span>⏱️ <strong>{candidate.experience_years} years</strong> experience</span>
                        <span>🎓 {candidate.education}</span>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div style={{
                      background: scoreBg,
                      border: `1px solid ${scoreColor}40`,
                      borderRadius: '16px',
                      padding: '12px 20px',
                      textAlign: 'center',
                      minWidth: '110px'
                    }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                        {candidate.overall_score}%
                      </div>
                      <small style={{ color: scoreColor, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        JOB MATCH
                      </small>
                    </div>
                  </div>

                  {/* AI Summary Section */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                    <strong style={{ fontSize: '0.82rem', color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                      🤖 AI Resume Summary
                    </strong>
                    <p style={{ color: '#334155', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                      {candidate.ai_summary}
                    </p>
                  </div>

                  {/* Matched vs Missing Skills */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {/* Matched Skills */}
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', display: 'block', marginBottom: '6px' }}>
                        ✓ Matched Skills ({candidate.matched_skills?.length || 0})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(candidate.matched_skills || []).map(skill => (
                          <span
                            key={skill}
                            style={{
                              background: '#dcfce7',
                              color: '#15803d',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600
                            }}
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', display: 'block', marginBottom: '6px' }}>
                        ⚠️ Missing Skills ({candidate.missing_skills?.length || 0})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(candidate.missing_skills || []).length > 0 ? (
                          candidate.missing_skills.map(skill => (
                            <span
                              key={skill}
                              style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600
                              }}
                            >
                              ⚠ {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                            Full skill coverage achieved!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation / Explanation Box */}
                  <div style={{
                    background: isTop ? '#eff6ff' : '#f1f5f9',
                    border: '1px solid',
                    borderColor: isTop ? '#bfdbfe' : '#e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '16px'
                  }}>
                    <strong style={{ fontSize: '0.82rem', color: isTop ? '#1e40af' : '#1e293b', display: 'block', marginBottom: '4px' }}>
                      💡 Explainable AI Recommendation
                    </strong>
                    <p style={{ color: isTop ? '#1e3a8a' : '#334155', fontSize: '0.86rem', margin: 0, lineHeight: 1.6 }}>
                      {candidate.ai_recommendation}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => setExpandedEvidenceId(expandedEvidenceId === candidate.id ? null : candidate.id)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      {expandedEvidenceId === candidate.id ? '▲ Hide Resume Evidence' : '▼ View Resume Sentence Evidence'}
                    </button>

                    {!candidate.is_uploaded && (
                      <Link
                        to={`/candidate/${candidate.id}`}
                        style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        Deep Profile & Interview Questions →
                      </Link>
                    )}
                  </div>

                  {/* Expandable Sentence Evidence Trail */}
                  {expandedEvidenceId === candidate.id && candidate.evidence_trail && candidate.evidence_trail.length > 0 && (
                    <div style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '8px' }}>
                        Verified Resume Quotes (Evidence Trail):
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {candidate.evidence_trail.map((ev, i) => (
                          <div key={i} style={{ fontSize: '0.82rem', color: '#1e293b', borderLeft: '3px solid #2563eb', paddingLeft: '10px' }}>
                            <strong style={{ color: '#2563eb' }}>{ev.skill || 'Claim'}: </strong>
                            <em>"{ev.quote}"</em>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )
            })}

            {filteredCandidates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
                <h3>No candidates found for this filter</h3>
                <p>Try clearing your search query or selecting "All Ranked".</p>
                <button
                  onClick={() => { setActiveTab('all'); setSearchQuery('') }}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

        </section>

      </main>

    </div>
  )
}
