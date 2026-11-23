import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import '../App.css'

export default function CandidateDashboard() {
  const [profile, setProfile] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('jobs') // 'jobs', 'applications', 'roadmap', 'profile'
  const [applyNotes, setApplyNotes] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch current profile or benchmark candidate profile
      const candRes = await fetch(`${API_BASE}/candidates/1`)
      if (candRes.ok) {
        const candData = await candRes.json()
        setProfile(candData.candidate)
      }

      // 2. Fetch open jobs
      const jobsRes = await fetch(`${API_BASE}/jobs`)
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData.jobs || [])
      }

      // 3. Fetch applications
      const appsRes = await fetch(`${API_BASE}/applications`)
      if (appsRes.ok) {
        const appsData = await appsRes.json()
        setApplications(appsData.applications || [])
      }
    } catch (err) {
      console.error('Failed to load candidate portal data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: applyNotes || 'Excited to apply!' })
      })
      const data = await res.json()
      if (res.ok) {
        setStatusMsg(`✓ Successfully applied for position! Status: Applied`)
        setSelectedJob(null)
        setApplyNotes('')
        fetchData()
        setTimeout(() => setStatusMsg(''), 4000)
      } else {
        setStatusMsg(`Application Notice: ${data.detail || 'Could not submit application.'}`)
      }
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '0 8%', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Navigation */}
      <nav style={{ padding: '20px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '1.4rem', fontWeight: 800, textDecoration: 'none', color: '#1e293b' }}>
          HireLens <span style={{ color: '#2563eb' }}>AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>Home</Link>
          <Link to="/screen" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>AI Screener 🚀</Link>
          <Link to="/candidate-dashboard" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 700 }}>Candidate Portal</Link>
          <Link to="/recruiter-dashboard" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>Recruiter Studio</Link>
          <Link to="/models" style={{ textDecoration: 'none', color: '#7c3aed', fontWeight: 600 }}>ML & DL Lab 🔬</Link>
        </div>
      </nav>

      {/* Header Profile Banner */}
      <div style={{ padding: '32px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800 }}>
            {(profile?.full_name || 'C').charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
              Welcome back, {profile?.full_name || 'Candidate'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
              {profile?.headline || 'Software Engineer'} • {profile?.location || 'San Francisco, CA'} • <span style={{ color: '#2563eb', fontWeight: 600 }}>{profile?.blind_id || 'Candidate #C-0001'}</span>
            </p>
          </div>
        </div>

        <Link to="/screen">
          <button style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            + Upload New Resume
          </button>
        </Link>
      </div>

      {statusMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontWeight: 600 }}>
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e2e8f0', marginBottom: '28px' }}>
        <button
          onClick={() => setActiveTab('jobs')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            color: activeTab === 'jobs' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'jobs' ? '3px solid #2563eb' : 'none'
          }}
        >
          💼 Browse Available Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            color: activeTab === 'applications' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'applications' ? '3px solid #2563eb' : 'none'
          }}
        >
          📋 My Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            color: activeTab === 'roadmap' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'roadmap' ? '3px solid #2563eb' : 'none'
          }}
        >
          🗺️ Skill Gap & Learning Roadmap
        </button>
      </div>

      {/* TAB 1: BROWSE JOBS */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', paddingBottom: '40px' }}>
          {jobs.map(job => (
            <div key={job.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{job.title}</h3>
                  <span style={{ fontSize: '0.78rem', background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    {job.location}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
                  {job.department} • Min {job.experience_min} yrs experience
                </div>

                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', marginBottom: '16px' }}>
                  {job.description.length > 180 ? job.description.slice(0, 180) + '...' : job.description}
                </p>

                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Required Skills:</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {job.required_skills?.map(s => (
                      <span key={s} style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                {selectedJob?.id === job.id ? (
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <textarea
                      rows={2}
                      placeholder="Add a brief note or cover message..."
                      value={applyNotes}
                      onChange={e => setApplyNotes(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '8px', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setSelectedJob(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                      <button onClick={() => handleApply(job.id)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Submit Application</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedJob(job)}
                    style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Apply Now 🚀
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: APPLICATIONS TRACKER */}
      {activeTab === 'applications' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>Active Job Applications</h3>
          {applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <p>You have not submitted any applications yet.</p>
              <button onClick={() => setActiveTab('jobs')} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                Browse Jobs Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {applications.map(app => (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{app.job_title}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{app.department} • Applied on {app.applied_at?.slice(0, 10)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: app.status === 'shortlisted' ? '#ecfdf5' : app.status === 'interview' ? '#eff6ff' : '#f1f5f9',
                      color: app.status === 'shortlisted' ? '#047857' : app.status === 'interview' ? '#1d4ed8' : '#475569'
                    }}>
                      {app.status === 'applied' ? '⏳ Application Received' : app.status === 'screened' ? '🔍 Under Review' : app.status === 'shortlisted' ? '✓ Shortlisted' : app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SKILL GAP & ROADMAP */}
      {activeTab === 'roadmap' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>
            Graph Intelligence Skill Growth Roadmap
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
            Based on current market requirements, here are the highest-ROI technical skills to maximize your match score.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>MILESTONE 1</div>
              <h4 style={{ margin: '6px 0', fontSize: '1.1rem', fontWeight: 700 }}>Containerization & Docker</h4>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                Master multi-stage Docker builds and Docker Compose for distributed local development.
              </p>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>Target: 2 Weeks • Expected Match Lift +15%</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>MILESTONE 2</div>
              <h4 style={{ margin: '6px 0', fontSize: '1.1rem', fontWeight: 700 }}>Kubernetes Orchestration</h4>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                Deploy pods, services, and ingress controllers on a local Minikube cluster.
              </p>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>Target: 3 Weeks • Expected Match Lift +20%</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>MILESTONE 3</div>
              <h4 style={{ margin: '6px 0', fontSize: '1.1rem', fontWeight: 700 }}>CI/CD Pipeline Automation</h4>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                Configure automated test execution and container registry deployment with GitHub Actions.
              </p>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>Target: 1 Week • Expected Match Lift +10%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
