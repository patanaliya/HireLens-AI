
import { Link } from 'react-router-dom'
import '../App.css'

function Home() {
  return (
    <div className="app">

      {/* Navigation */}
      <nav className="navbar" style={{ padding: '0 8%', minHeight: '78px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #edf1f7' }}>
        <Link to="/" style={{ textDecoration: 'none' }} className="logo">
          HireLens <span>AI</span>
        </Link>

        <div className="nav-links" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Home</Link>
          <Link to="/screen" style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>AI Screener 🚀</Link>
          <Link to="/recruiter-dashboard" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Recruiter Studio</Link>
          <Link to="/candidate-dashboard" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>Candidate Portal</Link>
          <Link to="/models" style={{ fontWeight: 700, color: '#7c3aed', textDecoration: 'none' }}>ML & DL Lab 🔬</Link>
          <Link to="/what-if" style={{ fontWeight: 600, color: '#475569', textDecoration: 'none' }}>What-If</Link>
          <Link to="/jd-bias" style={{ fontWeight: 600, color: '#475569', textDecoration: 'none' }}>JD Bias</Link>
        </div>

        <div className="nav-buttons" style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login">
            <button className="login-btn">Login</button>
          </Link>
          <Link to="/screen">
            <button className="signup-btn" style={{ background: '#2563eb', color: '#fff' }}>Screen Resumes 🚀</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="tagline">
            EXPLAINABLE, FAIR & RESPONSIBLE RECRUITMENT
          </div>

          <h1>
            Find the Right Talent.
            <br />
            <span>Hire Smarter & Fairer with AI.</span>
          </h1>

          <p>
            Transform resume screening with multi-file PDF/DOCX parsing, transparent evidence trails,
            blind screening bias elimination, interactive what-if ranking simulators,
            and honest candidate growth roadmaps.
          </p>

          <div className="hero-buttons" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link to="/screen">
              <button className="primary-btn" style={{ background: '#2563eb', color: '#fff', fontWeight: 800 }}>
                🚀 Upload & Screen Resumes
              </button>
            </Link>
            <Link to="/recruiter-dashboard">
              <button className="secondary-btn" style={{ background: '#f1f5f9', color: '#1e293b', fontWeight: 700 }}>
                Recruiter Studio →
              </button>
            </Link>
            <Link to="/candidate-dashboard">
              <button className="secondary-btn" style={{ background: '#f1f5f9', color: '#1e293b', fontWeight: 700 }}>
                Candidate Portal 💼
              </button>
            </Link>
            <Link to="/models">
              <button className="secondary-btn" style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe', fontWeight: 700 }}>
                ML & DL Lab 🔬
              </button>
            </Link>
          </div>

          <div className="hero-note" style={{ marginTop: '20px', color: '#64748b', fontSize: '0.9rem' }}>
            ✓ Explainable Evidence Trails • ✓ Blind Screening Mode • ✓ Non-Biased ATS
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="hero-visual">
          <div className="ai-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <div className="ai-icon" style={{ fontSize: '1.6rem', color: '#2563eb' }}>✦</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '8px' }}>HireLens AI Engine</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>Explainable Match & Evidence Verification</p>

            <div className="score-box" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Candidate Match Score</span>
                <strong style={{ fontSize: '1.5rem', color: '#2563eb' }}>94%</strong>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ width: '94%', height: '100%', background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>
                <span>Linked to exact resume sentences</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>
                <span>Blind Screening Mode supported</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>
                <span>Human-in-the-loop decision stamp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="features" id="features" style={{ padding: '60px 8%', background: '#f8fafc' }}>
        <div className="section-heading" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>CORE INTELLIGENCE</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>Engineered for Fairness & Trust</h2>
          <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Say goodbye to keyword-matching black boxes. HireLens AI explains every judgment.</p>
        </div>

        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

          {/* Explainable Match Scoring */}
          <Link to="/screen" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-card" style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', height: '100%' }}>
              <div className="feature-icon" style={{ fontSize: '2rem', marginBottom: '12px' }}>🎯</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Explainable Match Scoring</h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
                Every score is broken down by factor and linked directly to verified quotes in the candidate's resume.
              </p>
            </div>
          </Link>

          {/* Blind Screening Mode */}
          <Link to="/candidates?blind=true" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-card" style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', height: '100%' }}>
              <div className="feature-icon" style={{ fontSize: '2rem', marginBottom: '12px' }}>🛡️</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Blind Screening Mode</h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
                One-click toggle that strips candidate name, photo, gender, and institution to eliminate unconscious bias.
              </p>
            </div>
          </Link>

          {/* What-If Simulator */}
          <Link to="/what-if" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-card" style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', height: '100%' }}>
              <div className="feature-icon" style={{ fontSize: '2rem', marginBottom: '12px' }}>🎚️</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>"What-If" Weight Simulator</h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
                Adjust sliders for skills, experience, and growth to see real-time re-ranking of the candidate leaderboard.
              </p>
            </div>
          </Link>

          {/* JD Bias Analyzer */}
          <Link to="/jd-bias" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-card" style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', height: '100%' }}>
              <div className="feature-icon" style={{ fontSize: '2rem', marginBottom: '12px' }}>⚖️</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>JD Bias & Inclusivity Analyzer</h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
                Flags aggressive or exclusionary wording and automatically provides side-by-side inclusive rewrites.
              </p>
            </div>
          </Link>

          {/* Applied ML & Deep Learning Benchmark Lab */}
          <Link to="/models" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-card" style={{ background: '#fdf4ff', padding: '28px', borderRadius: '16px', border: '1px solid #f0abfc', height: '100%' }}>
              <div className="feature-icon" style={{ fontSize: '2rem', marginBottom: '12px' }}>🔬</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: '#701a75' }}>Applied ML & Deep Learning Lab</h3>
              <p style={{ color: '#86198f', fontSize: '0.92rem' }}>
                Comparative benchmarks (TF-IDF vs Random Forest vs Sentence-BERT), NDCG@3 metrics, and Four-Fifths fairness audits.
              </p>
            </div>
          </Link>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 8%', background: '#ffffff', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <div className="logo" style={{ marginBottom: '8px' }}>HireLens <span>AI</span></div>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>An Explainable, Fair & Responsible AI Resume Screening Platform</p>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '6px' }}>© 2026 HireLens AI. All rights reserved.</p>
      </footer>

    </div>
  )
}

export default Home
