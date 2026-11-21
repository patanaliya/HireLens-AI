
import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import '../App.css'

function Register() {
  const location = useLocation()

  const role = location.state?.role || 'candidate'
  const isCandidate = role === 'candidate'

  const [passwordError, setPasswordError] = useState('')
  const [passwordRuleError, setPasswordRuleError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate password rules
  function validatePassword(password) {
    if (password.length < 8) {
      return 'Password must contain at least 8 characters.'
    }

    if (!/^[A-Z]/.test(password)) {
      return 'First letter must be a capital letter (A-Z).'
    }

    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter.'
    }

    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number (0-9).'
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'Password must contain at least one special character (@, #, $, !).'
    }

    return ''
  }

  // Handle password input
  function handlePasswordChange(event) {
    const password = event.target.value

    setPasswordRuleError(validatePassword(password))
    setPasswordError('')
  }

  // Handle form submission and connect to backend
  async function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.target)

    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    const ruleError = validatePassword(password)

    if (ruleError) {
      setPasswordRuleError(ruleError)
      setPasswordError('')
      return
    }

    setPasswordRuleError('')

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match. Please try again.')
      return
    }

    setPasswordError('')

    const userData = {
      full_name: formData.get('fullName'),
      email: formData.get('email'),
      password: password,
      role: role,
      company_name: formData.get('companyName') || null
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.detail || 'Registration failed.')
        return
      }

      alert('Account created successfully!')

      event.target.reset()
      setPasswordRuleError('')
      setPasswordError('')

    } catch (error) {
      console.error('Registration error:', error)
      alert('Cannot connect to the server. Please try again.')

    } finally {
      setIsSubmitting(false)
    }
  }

  // Eye icon component
  function EyeIcon({ show }) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="21"
        height="21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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

  return (
    <div className="register-page">
      <div className="register-card">

        {/* Back button */}
        <Link to="/account-type" className="back-link">
          ← Back
        </Link>

        {/* Heading */}
        <div className="register-heading">
          <span>HIRELENS AI</span>

          <h1>Create Your Account</h1>

          <p>
            {isCandidate
              ? 'Start your career journey with smarter opportunities.'
              : 'Find and connect with the right talent using AI.'}
          </p>
        </div>

        {/* Account type */}
        <div className="role-label">
          Registering as:
          <strong>
            {isCandidate ? ' Candidate' : ' Recruiter'}
          </strong>
        </div>

        {/* Registration form */}
        <form className="register-form" onSubmit={handleSubmit}>

          {/* Full Name */}
          <label>
            Full Name <span className="required-star">*</span>
          </label>

          <input
            type="text"
            name="fullName"
            placeholder="Enter your full name"
            required
          />

          {/* Email */}
          <label>
            {isCandidate ? 'Email Address' : 'Work Email'}
            <span className="required-star">*</span>
          </label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
          />

          {/* Company Name - Recruiter only */}
          {!isCandidate && (
            <>
              <label>
                Company Name <span className="required-star">*</span>
              </label>

              <input
                type="text"
                name="companyName"
                placeholder="Enter your company name"
                required
              />
            </>
          )}

          {/* Password */}
          <label>
            Password <span className="required-star">*</span>
          </label>

          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Create a password"
              minLength="8"
              required
              onChange={handlePasswordChange}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon show={showPassword} />
            </button>
          </div>

          {/* Password rule error */}
          {passwordRuleError && (
            <p className="password-error">
              {passwordRuleError}
            </p>
          )}

          {/* Confirm Password */}
          <label>
            Confirm Password <span className="required-star">*</span>
          </label>

          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm your password"
              minLength="8"
              required
              onChange={() => setPasswordError('')}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword ? 'Hide password' : 'Show password'
              }
            >
              <EyeIcon show={showConfirmPassword} />
            </button>
          </div>

          {/* Password mismatch error */}
          {passwordError && (
            <p className="password-error">
              {passwordError}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="register-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account →'}
          </button>

        </form>

        {/* Login link */}
        <div className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>

      </div>
    </div>
  )
}

export default Register
