
import { Link } from 'react-router-dom'

function AccountType() {
  return (
    <div className="account-page">

      <div className="account-heading">
        <span>GET STARTED WITH HIRELENS AI</span>
        <h1>Choose Your Account Type</h1>
        <p>Select how you want to use our AI-powered recruitment platform.</p>
      </div>

      <div className="account-cards">

        {/* Candidate */}
        <div className="account-card">
          <div className="account-image">
  <img
    src="https://m.economictimes.com/thumb/msid-125107272,width-1200,height-900,resizemode-4,imgsize-103983/focused-young-professional-at-work-genz-office-work.jpg"
    alt="Professional candidate working on a laptop"
  />
</div>
          <h2>I'm a Candidate</h2>
          <p>
            Looking for your next career opportunity?
            Upload your resume, discover jobs and track your applications.
          </p>

          <ul>
            <li>✓ Upload your resume</li>
            <li>✓ Discover suitable jobs</li>
            <li>✓ Track applications</li>
            <li>✓ View resume insights</li>
          </ul>

          <Link to="/register" state={{ role: 'candidate' }}>
            <button className="account-btn">
              Continue as Candidate →
            </button>
          </Link>
        </div>

        {/* Recruiter */}
        <div className="account-card">
          <div className="account-image">
  <img
    src="https://static.wixstatic.com/media/466ec1_e02ba8994d854897bb8e6b820c33f305~mv2.jpeg/v1/fill/w_980,h_653,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/466ec1_e02ba8994d854897bb8e6b820c33f305~mv2.jpeg"
    alt="Recruiters reviewing candidate resumes"
  />
</div>
          <h2>I'm a Recruiter</h2>
          <p>
            Looking for the right talent?
            Post job openings, analyze resumes and discover qualified candidates.
          </p>

          <ul>
            <li>✓ Create job postings</li>
            <li>✓ Screen candidate resumes</li>
            <li>✓ AI-powered candidate ranking</li>
            <li>✓ Explainable hiring insights</li>
          </ul>

          <Link to="/register" state={{ role: 'recruiter' }}>
            <button className="account-btn">
              Continue as Recruiter →
            </button>
          </Link>
        </div>

      </div>

      <p className="account-footer">
        Already have an account? <Link to="/login">Login here</Link>
      </p>

    </div>
  )
}

export default AccountType
