import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_BASE } from '../config'
import '../App.css'

export default function CandidateProfile() {
  const { id } = useParams()

  const [candidate, setCandidate] = useState(null)
  const [screening, setScreening] = useState(null)
  const [blindMode, setBlindMode] = useState(false)
  const [selectedSkillEvidence, setSelectedSkillEvidence] = useState(null)
  const [loading, setLoading] = useState(true)
  const [screeningLoading, setScreeningLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [id])

  useEffect(() => {
    if (candidate) {
      runScreening(blindMode)
    }
  }, [blindMode, candidate?.id])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/candidates/${id}`)
      if (!res.ok) throw new Error('Candidate profile not found.')
      const data = await res.json()
      setCandidate(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runScreening = async (isBlind) => {
    try {
      setScreeningLoading(true)
      const res = await fetch(`${API_BASE}/api/screen-candidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: parseInt(id),
          job_id: 1,
          blind_mode: isBlind
        })
      })
      if (!res.ok) throw new Error('Failed to run AI screening')
      const data = await res.json()
      setScreening(data)
      if (data.evidence_trail && data.evidence_trail.length > 0) {
        setSelectedSkillEvidence(data.evidence_trail[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setScreeningLoading(false)
    }
  }

  if (loading) {
    return <div className="profile-message" style={{ textAlign: 'center', padding: '80px' }}>Loading candidate profile...</div>
  }

  if (error || !candidate) {
    return (
      <div className="profile-message" style={{ textAlign: 'center', padding: '80px' }}>
        <h2>Unable to Load Profile</h2>
        <p>{error || 'Candidate profile not found.'}</p>
        <Link to="/candidates" className="back-link">← Back to Candidates</Link>
      </div>
    )
  }

  const displayName = blindMode ? (screening?.blind_id || `Candidate #C-${candidate.id.toString().padStart(4, '0')}`) : candidate.full_name
  const displayLocation = blindMode ? 'Location Hidden (Blind Mode)' : candidate.location
  const displayEmail = blindMode ? 'email.masked@blind.hirelens' : candidate.email
  const displayEducation = blindMode ? 'Degree Verified • Institution Hidden' : candidate.education

  return (
    <div style={{ padding: '0 8%', maxWidth: '1440px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc', paddingBottom: '80px' }}>
      
      {/* Navigation */}
      <nav className="recruiter-navbar" style={{ padding: '20px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="recruiter-brand" style={{ fontSize: '1.4rem', fontWeight: 800, textDecoration: 'none', color: '#1e293b' }}>
          HireLens <span style={{ color: '#2563eb' }}>AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/candidates" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>← All Candidates</Link>
          <Link to="/what-if" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>What-If Simulator</Link>
          
          {/* F7: Blind Screening Toggle */}
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
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{blindMode ? '🛡️ Blind Mode: ON' : '👁️ Blind Mode: OFF'}</span>
          </button>
        </div>
      </nav>

      {/* Philosophy Banner */}
      <div style={{ marginTop: '20px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
          ⚖️ <strong>Honest & Advisory AI:</strong> Scores and insights are strictly advisory recommendations linked to resume evidence. Recruiters make all final hiring decisions.
        </div>
        <span style={{ fontSize: '0.78rem', background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
          Human-in-the-Loop
        </span>
      </div>

      {/* Candidate Header Card */}
      <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: blindMode ? '#334155' : 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
              {blindMode ? '🛡️' : displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{displayName}</h1>
                {blindMode && (
                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
                    PII Masked
                  </span>
                )}
              </div>
              <p style={{ color: '#475569', fontSize: '1.05rem', marginTop: '2px' }}>{candidate.headline}</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
                <span>📍 {displayLocation}</span>
                <span>•</span>
                <span>💼 {candidate.experience_years} Years Experience</span>
                <span>•</span>
                <span>🎓 {displayEducation}</span>
              </div>
            </div>
          </div>

          {/* AI Match Gauge */}
          {screening && (
            <div style={{ background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', border: '1px solid #dbeafe', padding: '20px 28px', borderRadius: '16px', textAlign: 'center', minWidth: '180px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Explainable Match
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1.1, margin: '4px 0' }}>
                {screening.overall_score}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Confidence: {Math.round(screening.factor_breakdown.skills * 100)}% Skills • {Math.round(screening.factor_breakdown.experience * 100)}% Exp
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Analysis Grid */}
      {screening && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', marginTop: '28px' }}>
          
          {/* LEFT COLUMN: EVIDENCE TRAIL & CLAIMS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* F3: Explainable Evidence Trail */}
            <div style={{ background: '#ffffff', padding: '28px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  F3 Evidence Trail & Resume Quotes
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Click skill to inspect quote</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
                Every score component is strictly verified against direct sentences found in the candidate's resume:
              </p>

              {/* Clickable Skill Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {screening.evidence_trail.map((ev, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSkillEvidence(ev)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedSkillEvidence?.factor === ev.factor ? '#2563eb' : '#cbd5e1',
                      background: selectedSkillEvidence?.factor === ev.factor ? '#2563eb' : '#f8fafc',
                      color: selectedSkillEvidence?.factor === ev.factor ? '#ffffff' : '#1e293b',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {ev.factor} • {Math.round(ev.confidence * 100)}%
                  </button>
                ))}
              </div>

              {/* Highlighted Quote Box */}
              {selectedSkillEvidence && (
                <div style={{ background: '#f8fafc', borderLeft: '4px solid #2563eb', padding: '18px', borderRadius: '0 12px 12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                      Verified Resume Sentence for {selectedSkillEvidence.factor}:
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                      ✓ {Math.round(selectedSkillEvidence.confidence * 100)}% Match Confidence
                    </span>
                  </div>
                  <blockquote style={{ fontSize: '0.98rem', fontStyle: 'italic', color: '#1e293b', lineHeight: '1.6' }}>
                    "{selectedSkillEvidence.sentence}"
                  </blockquote>
                </div>
              )}
            </div>

            {/* F4: Resume Claim Evidence Checker */}
            <div style={{ background: '#ffffff', padding: '28px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                F4 Resume Claim Evidence Checker
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px' }}>
                Flags major claims as <em>Supported</em> or <em>Needs Evidence</em> with polite interview probe suggestions:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {screening.claims_verification.map((claim, idx) => (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{claim.category}</span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: claim.status === 'Supported' ? '#ecfdf5' : '#fef3c7',
                          color: claim.status === 'Supported' ? '#047857' : '#b45309'
                        }}
                      >
                        {claim.status === 'Supported' ? '✓ Supported' : '⚠️ Needs Evidence'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                      "{claim.claim}"
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '0.82rem', color: '#475569' }}>
                      <strong>Suggested Probe:</strong> {claim.probe_question}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: GAP REPORT & ROADMAP & INTERVIEW */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* F1: Skill Gap & Learning Roadmap */}
            <div style={{ background: '#ffffff', padding: '28px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                F1 Skill Gap & Growth Roadmap
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '18px' }}>
                Evidence-backed analysis showing exact, transferable, and bridgeable skills:
              </p>

              {/* Matched Skills */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                  Matched & Transferable Competencies:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {screening.gap_report.matched_skills.map((m, i) => (
                    <span key={i} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      ✓ {m.required_skill} {m.match_type !== 'exact' && `(via ${m.candidate_skill})`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills & Roadmap */}
              {screening.gap_report.learning_roadmap.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                    Personalized Skill Roadmap (High-ROI Bridges):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {screening.gap_report.learning_roadmap.map((rm, i) => (
                      <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', color: '#92400e' }}>
                        <strong>{rm.step}:</strong> {rm.strategy} • <span style={{ color: '#b45309' }}>{rm.target_timeline}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Growth Evidence Paragraph */}
              <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Evidence of Growth (Honest AI Analysis):
                </div>
                <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                  {screening.gap_report.growth_evidence}
                </p>
              </div>
            </div>

            {/* F10: Adaptive Interview Questions */}
            <div style={{ background: '#ffffff', padding: '28px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                F10 Adaptive Interview Questions
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
                Tailored technical & behavioral questions targeting candidate-specific gaps:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {screening.interview_questions.map((q, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb' }}>{q.type}</span>
                      <span style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{q.difficulty}</span>
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      {q.question}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      <strong>Target:</strong> {q.ideal_answer_outline}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  )
}
