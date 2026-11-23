import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AccountType from './pages/AccountType'
import Candidates from './pages/Candidates'
import CandidateProfile from './pages/CandidateProfile'
import WhatIfSimulator from './pages/WhatIfSimulator'
import JDBiasAnalyzer from './pages/JDBiasAnalyzer'
import ResumeScreener from './pages/ResumeScreener'
import CandidateDashboard from './pages/CandidateDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import ModelBenchmarks from './pages/ModelBenchmarks'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/screen" element={<ResumeScreener />} />
        <Route path="/screening" element={<ResumeScreener />} />
        <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
        <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
        <Route path="/models" element={<ModelBenchmarks />} />
        <Route path="/benchmarks" element={<ModelBenchmarks />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account-type" element={<AccountType />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/candidate/:id" element={<CandidateProfile />} />
        <Route path="/what-if" element={<WhatIfSimulator />} />
        <Route path="/jd-bias" element={<JDBiasAnalyzer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
