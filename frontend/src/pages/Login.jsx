import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'
import '../App.css'

function Login() {
  const navigate = useNavigate()

  // 'none' | 'candidate' | 'recruiter'
  const [selectedRole, setSelectedRole] = useState('none')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function EyeIcon({ show }) {
    return (
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {show ? (
          <>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          <>
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.8" />
            <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.1 0 2.1-.2 3-.6" />
          </>
        )}
      </svg>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid email or password.')
      }

      localStorage.setItem('hirelens_token', data.access_token)
      localStorage.setItem('hirelens_user', JSON.stringify(data.user))

      if (data.user?.role === 'candidate') {
        navigate('/candidate/2')
      } else {
        navigate('/candidates')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function quickFill(role) {
    if (role === 'recruiter') {
      setEmail('recruiter@hirelens.ai')
      setPassword('Recruiter@123')
    } else {
      setEmail('priya.sharma@example.com')
      setPassword('Candidate@123')
    }
    setError('')
    setSelectedRole(role)
  }

  /* ── Original Project Images ── */
  const CANDIDATE_IMAGE = "https://m.economictimes.com/thumb/msid-125107272,width-1200,height-900,resizemode-4,imgsize-103983/focused-young-professional-at-work-genz-office-work.jpg"
  const RECRUITER_IMAGE = "https://static.wixstatic.com/media/466ec1_e02ba8994d854897bb8e6b820c33f305~mv2.jpeg/v1/fill/w_980,h_653,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/466ec1_e02ba8994d854897bb8e6b820c33f305~mv2.jpeg"

  /* ── Login form (shown after role selection) ── */
  const LoginForm = ({ role }) => (
    <div style={{ padding: '30px 32px', background: 'rgba(255,255,255,0.98)', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', maxWidth: 420, width: '100%', margin: '0 auto' }}>
      <button onClick={() => { setSelectedRole('none'); setError('') }}
        style={{ background: 'none', border: 'none', color: '#3478f6', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        ← Back to Role Selection
      </button>

      {/* Role Image Thumbnail */}
      <div style={{ width: '100%', height: 130, borderRadius: 10, overflow: 'hidden', marginBottom: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <img
          src={role === 'candidate' ? CANDIDATE_IMAGE : RECRUITER_IMAGE}
          alt={role}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#3478f6', marginBottom: 6 }}>HIRELENS AI</div>
        <h2 style={{ color: '#172b50', fontSize: 22, marginBottom: 6 }}>
          {role === 'candidate' ? '👤 Candidate Login' : '👔 Recruiter Login'}
        </h2>
        <p style={{ color: '#78849a', fontSize: 13 }}>
          {role === 'candidate' ? 'View your AI match score, skill gaps & roadmap.' : 'Screen candidates, detect bias, run simulations.'}
        </p>
      </div>

      {/* Quick demo fill */}
      <div style={{ background: '#edf3ff', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#526078', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Demo credentials</span>
        <button type="button" onClick={() => quickFill(role)}
          style={{ background: '#3478f6', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Fill ↗
        </button>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <label>Email Address <span className="required-star">*</span></label>
        <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />

        <label>Password <span className="required-star">*</span></label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
            <EyeIcon show={showPassword} />
          </button>
        </div>

        {error && <p className="password-error">{error}</p>}

        <button type="submit" className="register-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login →'}
        </button>
      </form>

      <div className="register-footer" style={{ marginTop: 20 }}>
        Don't have an account? <Link to="/account-type">Get Started</Link>
      </div>
    </div>
  )

  /* ── Split panel UI ── */
  if (selectedRole !== 'none') {
    return (
      <div style={{
        minHeight: '100vh',
        background: selectedRole === 'candidate'
          ? 'linear-gradient(135deg, #0f2a5a 0%, #1a4bab 100%)'
          : 'linear-gradient(135deg, #0d3b2e 0%, #1a7a52 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <LoginForm role={selectedRole} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', padding: '18px 6%', borderBottom: '1px solid #edf1f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ color: '#17366b', fontWeight: 800, fontSize: 20, textDecoration: 'none' }}>HireLens AI</Link>
        <Link to="/account-type" style={{ color: '#3478f6', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Create Account →</Link>
      </div>

      {/* Two-panel split */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 65px)' }}>

        {/* ── LEFT: Candidate panel ── */}
        <div
          onClick={() => setSelectedRole('candidate')}
          style={{
            background: 'linear-gradient(145deg, #0f2a5a 0%, #1a4bab 60%, #2563d4 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 8%',
            cursor: 'pointer',
            transition: 'filter 0.25s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          {/* Background pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />

          <div style={{ position: 'relative', textAlign: 'center', maxWidth: 340 }}>
            {/* Candidate Image */}
            <div style={{
              width: '100%',
              maxWidth: 300,
              height: 190,
              margin: '0 auto 26px',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.25)',
              background: '#0e2b60'
            }}>
              <img
                src={CANDIDATE_IMAGE}
                alt="Candidate Job Seeker"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.9)', marginBottom: 18 }}>
              FOR CANDIDATES
            </div>

            <h2 style={{ color: '#ffffff', fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              I'm a <span style={{ color: '#83b4ff' }}>Candidate</span>
            </h2>

            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
              Discover your AI match score, uncover skill gaps, track your career roadmap, and prepare for interviews — all in one place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36, textAlign: 'left' }}>
              {['🎯 AI-powered match scoring', '📚 Personalized skill roadmap', '🔍 Evidence-based profile', '🤖 Adaptive interview prep'].map(item => (
                <div key={item} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item}
                </div>
              ))}
            </div>

            <button style={{
              background: '#ffffff',
              color: '#1a4bab',
              border: 'none',
              borderRadius: 10,
              padding: '14px 36px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: '100%'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
            >
              Login as Candidate →
            </button>
          </div>
        </div>

        {/* ── RIGHT: Recruiter panel ── */}
        <div
          onClick={() => setSelectedRole('recruiter')}
          style={{
            background: 'linear-gradient(145deg, #0d3b2e 0%, #1a7a52 60%, #22a06b 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 8%',
            cursor: 'pointer',
            transition: 'filter 0.25s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          {/* Background pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />

          <div style={{ position: 'relative', textAlign: 'center', maxWidth: 340 }}>
            {/* Recruiter Image */}
            <div style={{
              width: '100%',
              maxWidth: 300,
              height: 190,
              margin: '0 auto 26px',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.25)',
              background: '#0d3b2e'
            }}>
              <img
                src={RECRUITER_IMAGE}
                alt="Recruiter Hiring Manager"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.9)', marginBottom: 18 }}>
              FOR RECRUITERS
            </div>

            <h2 style={{ color: '#ffffff', fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              I'm a <span style={{ color: '#86efca' }}>Recruiter</span>
            </h2>

            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
              Screen candidates with explainable AI, detect bias in job descriptions, simulate re-rankings, and build fairer pipelines.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36, textAlign: 'left' }}>
              {['📊 AI screening dashboard', '⚖️ JD bias analyzer', '🔄 What-if re-ranking', '📋 Fairness audit reports'].map(item => (
                <div key={item} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item}
                </div>
              ))}
            </div>

            <button style={{
              background: '#ffffff',
              color: '#1a7a52',
              border: 'none',
              borderRadius: 10,
              padding: '14px 36px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: '100%'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
            >
              Login as Recruiter →
            </button>
          </div>
        </div>

      </div>

      {/* Divider label in center */}
      <style>{`
        @media (max-width: 700px) {
          .login-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Login