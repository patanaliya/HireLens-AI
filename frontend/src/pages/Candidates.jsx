
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import '../App.css'

function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('All Skills')
  const [experienceFilter, setExperienceFilter] = useState('All Experience')
  const [sortBy, setSortBy] = useState('newest')
  const [blindMode, setBlindMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const response = await fetch(`${API_BASE}/candidates`)

        if (!response.ok) {
          throw new Error('Unable to load candidate profiles.')
        }

        const data = await response.json()
        const parsed = (data.candidates || []).map(c => {
          let s = c.skills
          if (typeof s === 'string') {
            try { s = JSON.parse(s) } catch { s = [] }
          }
          return { ...c, skills: Array.isArray(s) ? s : [] }
        })
        setCandidates(parsed)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [])

  const allSkills = useMemo(() => {
    return [...new Set(candidates.flatMap(candidate => candidate.skills || []))]
      .sort()
  }, [candidates])

  const filteredCandidates = useMemo(() => {
    let result = candidates.filter(candidate => {
      const searchableText = [
        candidate.full_name,
        candidate.headline,
        candidate.location,
        candidate.education,
        ...(candidate.skills || [])
      ].join(' ').toLowerCase()

      const matchesSearch = searchableText.includes(search.toLowerCase())

      const matchesSkill =
        skillFilter === 'All Skills' ||
        (candidate.skills || []).some(
          skill => skill.toLowerCase() === skillFilter.toLowerCase()
        )

      const experience = Number(candidate.experience_years || 0)

      const matchesExperience =
        experienceFilter === 'All Experience' ||
        (experienceFilter === '0-2 years' && experience <= 2) ||
        (experienceFilter === '3-5 years' && experience >= 3 && experience <= 5) ||
        (experienceFilter === '5+ years' && experience > 5)

      return matchesSearch && matchesSkill && matchesExperience
    })

    if (sortBy === 'experience-high') {
      result.sort((a, b) => Number(b.experience_years) - Number(a.experience_years))
    } else if (sortBy === 'experience-low') {
      result.sort((a, b) => Number(a.experience_years) - Number(b.experience_years))
    } else {
      result.sort((a, b) => b.id - a.id)
    }

    return result
  }, [candidates, search, skillFilter, experienceFilter, sortBy])

  const averageExperience = candidates.length
    ? (
        candidates.reduce(
          (sum, candidate) => sum + Number(candidate.experience_years || 0),
          0
        ) / candidates.length
      ).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className="recruiter-page">
        <p>Loading candidate profiles...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recruiter-page">
        <h2>Unable to load candidates</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="recruiter-page">
      <header className="recruiter-navbar">
        <Link to="/" className="recruiter-brand">
          HireLens <span>AI</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/">Home</Link>
          <Link to="/screen" style={{ color: '#2563eb', fontWeight: 700 }}>AI Screener 🚀</Link>
          <Link to="/what-if" style={{ color: '#475569', fontWeight: 600 }}>What-If Simulator 🎚️</Link>
          <Link to="/jd-bias" style={{ color: '#7c3aed', fontWeight: 600 }}>JD Bias Analyzer ⚖️</Link>
          <button
            onClick={() => setBlindMode(!blindMode)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: blindMode ? '#059669' : '#cbd5e1',
              background: blindMode ? '#ecfdf5' : '#ffffff',
              color: blindMode ? '#047857' : '#475569',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {blindMode ? '🛡️ Blind Mode: ON' : '👁️ Blind Mode: OFF'}
          </button>
        </nav>

        <div className="recruiter-label">RECRUITER WORKSPACE</div>
      </header>

      <main className="recruiter-content">
        <section className="recruiter-heading">
          <div>
            <span className="eyebrow">TALENT INTELLIGENCE</span>
            <h1>Explore Candidates</h1>
            <p>
              Discover professionals, explore their skills, and identify
              relevant talent for your hiring needs.
            </p>
          </div>

          <div className="candidate-total">
            <span>Talent database</span>
            <strong>{candidates.length.toString().padStart(2, '0')}</strong>
            <small>Registered profiles</small>
          </div>
        </section>

        <section className="candidate-stats">
          <div className="candidate-stat">
            <span className="stat-icon">♙</span>
            <div>
              <small>Total Candidates</small>
              <strong>{candidates.length}</strong>
            </div>
          </div>

          <div className="candidate-stat">
            <span className="stat-icon">✦</span>
            <div>
              <small>Unique Skills</small>
              <strong>{allSkills.length}</strong>
            </div>
          </div>

          <div className="candidate-stat">
            <span className="stat-icon">◷</span>
            <div>
              <small>Average Experience</small>
              <strong>
                {averageExperience} <small>years</small>
              </strong>
            </div>
          </div>
        </section>

        <section className="candidate-directory" id="candidate-list">
          <div className="directory-heading">
            <div>
              <h2>Candidate Directory</h2>
              <p>Search and filter registered professionals</p>
            </div>

            <span className="result-count">
              {filteredCandidates.length} results
            </span>
          </div>

          <div className="candidate-filters">
            <div className="candidate-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search name, skills, education or location..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>

            <select
              value={skillFilter}
              onChange={event => setSkillFilter(event.target.value)}
            >
              <option>All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>

            <select
              value={experienceFilter}
              onChange={event => setExperienceFilter(event.target.value)}
            >
              <option>All Experience</option>
              <option>0-2 years</option>
              <option>3-5 years</option>
              <option>5+ years</option>
            </select>

            <select
              value={sortBy}
              onChange={event => setSortBy(event.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="experience-high">Most Experience</option>
              <option value="experience-low">Least Experience</option>
            </select>
          </div>

          <div className="candidate-results">
            {filteredCandidates.map(candidate => (
              <article className="professional-card" key={candidate.id}>
                <div className="profile-avatar" style={{ background: blindMode ? '#334155' : undefined }}>
                  {blindMode ? '🛡️' : (candidate.full_name || 'C').charAt(0).toUpperCase()}
                </div>

                <div className="professional-info">
                  <div className="professional-top">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3>{blindMode ? `Candidate #C-${candidate.id.toString().padStart(4, '0')}` : (candidate.full_name || 'Candidate')}</h3>
                        {blindMode && <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>PII Masked</span>}
                      </div>
                      <p className="professional-title">
                        {candidate.headline || 'Professional Candidate'}
                      </p>
                    </div>

                    <span className="profile-status">
                      AI SCREEN READY
                    </span>
                  </div>

                  <div className="professional-details">
                    <span>
                      ⌖ {blindMode ? 'Location Hidden' : (candidate.location || 'Location not provided')}
                    </span>
                    <span>
                      ◷ {candidate.experience_years || 0} years experience
                    </span>
                    <span>
                      ▤ {blindMode ? 'Degree Verified' : (candidate.education || 'Education not provided')}
                    </span>
                  </div>

                  <div className="professional-skills">
                    {(candidate.skills || []).map(skill => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="profile-action">
                  <Link
                    to={`/candidate/${candidate.id}`}
                    className="view-profile-btn"
                  >
                    View Profile →
                  </Link>

                  <small>Candidate ID: #{candidate.id}</small>
                </div>
              </article>
            ))}

            {filteredCandidates.length === 0 && (
              <div className="empty-candidates">
                <h3>No matching candidates found</h3>
                <p>Try changing your search or filter settings.</p>

                <button
                  onClick={() => {
                    setSearch('')
                    setSkillFilter('All Skills')
                    setExperienceFilter('All Experience')
                    setSortBy('newest')
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        <footer className="recruiter-footer">
          <span>HireLens AI</span>
          <p>Intelligent recruitment powered by responsible AI.</p>
        </footer>
      </main>
    </div>
  )
}

export default Candidates
