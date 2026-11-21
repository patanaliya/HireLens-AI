import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

export default function WhatIfSimulator() {
  const [candidates, setCandidates] = useState([])
  const [weights, setWeights] = useState({
    skills: 0.45,
    experience: 0.35,
    growth: 0.20
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSimulation(weights)
  }, [])

  const fetchSimulation = async (currentWeights) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/what-if-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: currentWeights })
      })
      const data = await res.json()
      setCandidates(data.simulated_candidates || [])
    } catch (err) {
      console.error('Failed to simulate:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSliderChange = (factor, value) => {
    const newWeights = { ...weights, [factor]: parseFloat(value) }
    setWeights(newWeights)
    fetchSimulation(newWeights)
  }

  return (
    <div className="what-if-page" style={{ padding: '0 8%', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navigation */}
      <nav className="recruiter-navbar" style={{ padding: '20px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="recruiter-brand" style={{ fontSize: '1.4rem', fontWeight: 800, textDecoration: 'none', color: '#1e293b' }}>
          HireLens <span style={{ color: '#2563eb' }}>AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/candidates" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>← Candidates</Link>
          <Link to="/jd-bias" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>JD Bias Analyzer</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ padding: '32px 0 24px' }}>
        <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
          F11 RECRUITER WORKFLOW
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          "What-If" Weight Simulator
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '750px' }}>
          Adjust recruiter priority sliders below. Watch how candidate leaderboard rankings adapt in real time based on your hiring criteria, with complete transparent math.
        </p>
      </div>

      {/* Simulator Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '32px', paddingBottom: '60px' }}>
        
        {/* Left: Controls Panel */}
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', color: '#1e293b' }}>
            Priority Sliders
          </h3>

          {/* Slider 1: Skills */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>💡 Technical Skills</span>
              <span style={{ fontWeight: 700, color: '#2563eb' }}>{Math.round(weights.skills * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={weights.skills}
              onChange={(e) => handleSliderChange('skills', e.target.value)}
              style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Evaluates exact & transferable skill graph coverage</span>
          </div>

          {/* Slider 2: Experience */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>💼 Years of Experience</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>{Math.round(weights.experience * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={weights.experience}
              onChange={(e) => handleSliderChange('experience', e.target.value)}
              style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Weights proven roles in work history & projects</span>
          </div>

          {/* Slider 3: Growth */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>📈 Evidence of Growth</span>
              <span style={{ fontWeight: 700, color: '#7c3aed' }}>{Math.round(weights.growth * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={weights.growth}
              onChange={(e) => handleSliderChange('growth', e.target.value)}
              style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Measures learning velocity & self-driven milestones</span>
          </div>

          <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', color: '#475569' }}>
            <strong>Fairness Tip:</strong> Giving higher weight to <em>Evidence of Growth</em> encourages inclusive hiring of high-potential candidates who quickly master new tools.
          </div>
        </div>

        {/* Right: Live Re-sorted Leaderboard */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
              Live Candidate Ranking ({candidates.length})
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Re-sorting dynamically</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {candidates.map((cand) => (
              <div
                key={cand.id}
                style={{
                  background: '#ffffff',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: cand.rank === 1 ? '#fef3c7' : '#f1f5f9',
                      color: cand.rank === 1 ? '#b45309' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem'
                    }}
                  >
                    #{cand.rank}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Link to={`/candidate/${cand.id}`} style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', textDecoration: 'none' }}>
                        {cand.full_name}
                      </Link>
                      <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', color: '#64748b', fontWeight: 600 }}>
                        {cand.blind_id}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '2px' }}>
                      {cand.headline} • {cand.experience_years} yrs exp
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>
                      {cand.simulated_score}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Original: {cand.original_score}%
                    </div>
                  </div>

                  <Link
                    to={`/candidate/${cand.id}`}
                    style={{
                      padding: '8px 16px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    Evidence Trail →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
