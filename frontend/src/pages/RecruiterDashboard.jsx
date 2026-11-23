import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import '../App.css'

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('post-job') // 'post-job', 'active-jobs', 'applicants'
  const [statusMsg, setStatusMsg] = useState('')

  // New Job Form State
  const [newTitle, setNewTitle] = useState('')
  const [newDept, setNewDept] = useState('Engineering')
  const [newLoc, setNewLoc] = useState('Remote')
  const [newExp, setNewExp] = useState(3)
  const [newDesc, setNewDesc] = useState('')
  const [newReqSkills, setNewReqSkills] = useState('Python, FastAPI, React, PostgreSQL, Docker')
  const [newPrefSkills, setNewPrefSkills] = useState('Kubernetes, AWS, Redis')
  const [biasResult, setBiasResult] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const jobsRes = await fetch(`${API_BASE}/jobs`)
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData.jobs || [])
      }

      const appsRes = await fetch(`${API_BASE}/applications`)
      if (appsRes.ok) {
        const appsData = await appsRes.json()
        setApplications(appsData.applications || [])
      }
    } catch (err) {
      console.error('Failed to load recruiter data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostJob = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDesc.trim()) return

    setCreating(true)
    setStatusMsg('')
    try {
      const reqList = newReqSkills.split(',').map(s => s.trim()).filter(Boolean)
      const prefList = newPrefSkills.split(',').map(s => s.trim()).filter(Boolean)

      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-recruiter-token'
        },
        body: JSON.stringify({
          title: newTitle,
          department: newDept,
          location: newLoc,
          experience_min: Number(newExp),
          description: newDesc,
          required_skills: reqList,
          preferred_skills: prefList
        })
      })

      const data = await res.json()
      if (res.ok) {
        setStatusMsg(`✓ Job Opening '${newTitle}' published successfully!`)
        setBiasResult(data.bias_feedback)
        setNewTitle('')
        setNewDesc('')
        fetchData()
      } else {
        setStatusMsg(`Error: ${data.detail || 'Failed to post job.'}`)
      }
    } catch (err) {
      setStatusMsg(`Connection Error: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-recruiter-token'
        },
        body: JSON.stringify({ status: newStatus, notes: 'Human review decision logged.' })
      })
      if (res.ok) {
        setStatusMsg(`✓ Candidate application updated to stage: ${newStatus}`)
        fetchData()
        setTimeout(() => setStatusMsg(''), 3000)
      }
    } catch (err) {
      console.error('Failed to update stage:', err)
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
          <Link to="/screen" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 700 }}>AI Screener 🚀</Link>
          <Link to="/recruiter-dashboard" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 700 }}>Recruiter Studio</Link>
          <Link to="/candidate-dashboard" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>Candidate Portal</Link>
          <Link to="/models" style={{ textDecoration: 'none', color: '#7c3aed', fontWeight: 600 }}>ML & DL Lab 🔬</Link>
        </div>
      </nav>

      {/* Header Banner */}
      <div style={{ padding: '32px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '8px' }}>
            ENTERPRISE TALENT ACQUISITION WORKSPACE
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            Recruiter Studio & Job Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '800px', margin: 0 }}>
            Post customized openings with automated bias auditing, manage active applicant pipelines, and launch AI explainable screening.
          </p>
        </div>

        <Link to="/screen">
          <button style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            ⚡ Launch AI Multi-Resume Screener
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
          onClick={() => setActiveTab('post-job')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            color: activeTab === 'post-job' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'post-job' ? '3px solid #2563eb' : 'none'
          }}
        >
          ✍️ Post New Job Opening
        </button>
        <button
          onClick={() => setActiveTab('active-jobs')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            color: activeTab === 'active-jobs' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'active-jobs' ? '3px solid #2563eb' : 'none'
          }}
        >
          📂 Active Job Openings ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('applicants')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            color: activeTab === 'applicants' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'applicants' ? '3px solid #2563eb' : 'none'
          }}
        >
          👥 Applicant Pipeline ({applications.length})
        </button>
      </div>

      {/* TAB 1: POST NEW JOB */}
      {activeTab === 'post-job' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px', paddingBottom: '40px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 18px', color: '#0f172a' }}>Job Opening Details</h3>

            <form onSubmit={handlePostJob}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Distributed Systems Engineer"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Department</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Location</label>
                  <input
                    type="text"
                    value={newLoc}
                    onChange={e => setNewLoc(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Min Experience (Yrs)</label>
                  <input
                    type="number"
                    value={newExp}
                    onChange={e => setNewExp(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Required Technical Skills (comma-separated)</label>
                <input
                  type="text"
                  value={newReqSkills}
                  onChange={e => setNewReqSkills(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Preferred Skills (Optional)</label>
                <input
                  type="text"
                  value={newPrefSkills}
                  onChange={e => setNewPrefSkills(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Job Description</label>
                <textarea
                  rows={6}
                  placeholder="Describe key responsibilities, deliverables, and team dynamics..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
              >
                {creating ? 'Analyzing & Publishing...' : 'Publish Job Opening ✨'}
              </button>
            </form>
          </div>

          {/* Side Panel: Bias Audit & Tips */}
          <div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>
                FAIRNESS SCANNER
              </div>
              <h4 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 800 }}>Automated Inclusivity Check</h4>
              <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5' }}>
                Every job description submitted is automatically analyzed for exclusionary phrases before publication.
              </p>

              {biasResult && (
                <div style={{ marginTop: '14px', background: '#fef3c7', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <strong style={{ color: '#92400e', display: 'block', marginBottom: '4px' }}>
                    Inclusivity Status: {biasResult.inclusivity_rating}
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: '#b45309' }}>
                    {biasResult.flagged_count} potential bias terms detected and rewritten.
                  </span>
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>Recruiter Quick Actions</h4>
              <ul style={{ paddingLeft: '18px', color: '#475569', fontSize: '0.85rem', lineHeight: '1.8' }}>
                <li><Link to="/screen" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Multi-Resume Screener</Link>: Rank bulk resumes</li>
                <li><Link to="/what-if" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>What-If Simulator</Link>: Re-weight ranking factors</li>
                <li><Link to="/jd-bias" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>JD Bias Analyzer</Link>: Standalone rewrite tool</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE JOBS */}
      {activeTab === 'active-jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
          {jobs.map(job => (
            <div key={job.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{job.title}</h3>
                <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>Active</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
                {job.department} • {job.location} • {job.applicant_count} Applicants
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {job.required_skills?.map(s => (
                  <span key={s} style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>{s}</span>
                ))}
              </div>

              <Link to="/screen">
                <button style={{ width: '100%', background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
                  Screen Resumes for this Role →
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: APPLICANTS PIPELINE */}
      {activeTab === 'applicants' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>Applicant Pipeline Management</h3>

          {applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <p>No candidate applications currently in the pipeline.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {applications.map(app => (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      {app.candidate_name} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>({app.blind_id})</span>
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Position: <strong>{app.job_title}</strong> • Applied: {app.applied_at?.slice(0, 10)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={app.status}
                      onChange={e => handleUpdateStatus(app.id, e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, background: '#fff' }}
                    >
                      <option value="applied">Applied</option>
                      <option value="screened">Screened</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <Link to={`/candidate/${app.candidate_id || 1}`}>
                      <button style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                        View Dossier →
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
