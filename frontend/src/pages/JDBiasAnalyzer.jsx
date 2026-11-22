import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import '../App.css'

const SAMPLE_BIASED_JD = `We are looking for a rockstar full-stack developer and coding ninja to join our young energetic team.
You will dominate complex systems and work hard play hard in a high-pressure environment with aggressive targets.
Must be a digital native with 5+ years building distributed applications.`

export default function JDBiasAnalyzer() {
  const [jdText, setJdText] = useState(SAMPLE_BIASED_JD)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const resultsRef = useRef(null)

  const handleAnalyze = async () => {
    if (!jdText.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/jobs/analyze-bias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText })
      })
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      setAnalysis(data)
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } catch (err) {
      console.error('Failed to analyze JD:', err)
      setError(`Failed to connect to backend at ${API_BASE}. Make sure the backend server is running on port 8000. (${err.message})`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!analysis || !analysis.inclusive_rewrite) return
    navigator.clipboard.writeText(analysis.inclusive_rewrite)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '0 8%', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navigation */}
      <nav className="recruiter-navbar" style={{ padding: '20px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="recruiter-brand" style={{ fontSize: '1.4rem', fontWeight: 800, textDecoration: 'none', color: '#1e293b' }}>
          HireLens <span style={{ color: '#2563eb' }}>AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>Home</Link>
          <Link to="/screen" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 700 }}>AI Screener 🚀</Link>
          <Link to="/candidates" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>Candidates</Link>
          <Link to="/what-if" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>What-If Simulator</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ padding: '32px 0 24px' }}>
        <div style={{ display: 'inline-block', background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
          F8 FAIRNESS & RESPONSIBLE AI
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Job Description Bias Analyzer
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '750px' }}>
          Ensures job descriptions welcome diverse talent by detecting subtle gendered, exclusionary, or hyper-aggressive phrasing, generating an inclusive rewrite before publication.
        </p>
      </div>

      {/* Input Section */}
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
            Job Description Text:
          </label>
          <button
            onClick={() => {
              setJdText(SAMPLE_BIASED_JD)
              setError('')
            }}
            style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Load Sample Biased JD
          </button>
        </div>

        <textarea
          rows={5}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste job description here to analyze for bias..."
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            lineHeight: '1.5',
            outline: 'none',
            marginBottom: '16px'
          }}
        />

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={handleAnalyze}
            disabled={loading || !jdText.trim()}
            style={{
              padding: '12px 28px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
            }}
          >
            {loading ? 'Analyzing Language...' : 'Scan for Bias & Generate Rewrite ✨'}
          </button>
        </div>
      </div>

      {/* Results View */}
      {analysis && (
        <div ref={resultsRef} style={{ paddingBottom: '60px' }}>
          {/* Summary Score Bar */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div style={{ background: '#ffffff', padding: '20px 28px', borderRadius: '14px', border: '1px solid #e2e8f0', flex: 1, minWidth: '240px' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Inclusivity Status</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: analysis.flagged_count > 0 ? '#b45309' : '#059669', marginTop: '4px' }}>
                {analysis.inclusivity_rating}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '20px 28px', borderRadius: '14px', border: '1px solid #e2e8f0', flex: 1, minWidth: '240px' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Exclusionary Terms Flagged</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                {analysis.flagged_count} phrases
              </div>
            </div>
          </div>

          {/* Flagged Terms Breakdown */}
          {analysis.flagged_terms && analysis.flagged_terms.length > 0 && (
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
                Flagged Terminology & Recommendations
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {analysis.flagged_terms.map((term, i) => (
                  <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ textDecoration: 'line-through', color: '#b91c1c', fontWeight: 700 }}>
                        "{term.original}"
                      </span>
                      <span>→</span>
                      <span style={{ color: '#047857', fontWeight: 700 }}>
                        "{term.suggestion}"
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
                      {term.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side by Side Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {/* Original */}
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>Original JD</h4>
              <p style={{ fontSize: '0.92rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {jdText}
              </p>
            </div>

            {/* Inclusive Rewrite */}
            <div style={{ background: '#f0fdf4', padding: '24px', borderRadius: '16px', border: '1px solid #bbf7d0', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#15803d' }}>Inclusive AI Rewrite</h4>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '6px 14px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy Text'}
                </button>
              </div>
              <p style={{ fontSize: '0.92rem', color: '#166534', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {analysis.inclusive_rewrite}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
