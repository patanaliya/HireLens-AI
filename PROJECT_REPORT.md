# 📄 Academic & Technical Project Report
## AI-Powered Resume Screening and Candidate Ranking System (HireLens AI)

---

## 1. Executive Summary
- **Project Title:** HireLens AI — Responsible & Explainable Resume Screening System  
- **Category:** Full-Stack AI/ML Web Application  
- **Author:** Patan Aliya  
- **Tech Stack:** React 19, Vite, Python 3.13, FastAPI, NetworkX, PyMuPDF, SQLite / PostgreSQL  
- **GitHub Repository:** https://github.com/patanaliya/HireLens-AI

### Objective:
Traditional Applicant Tracking Systems (ATS) rely on rigid keyword-matching black boxes that arbitrarily filter out qualified candidates and introduce unconscious bias. **HireLens AI** transforms recruitment by pairing semantic Natural Language Processing (NLP) with an explainable Skill Graph to parse resumes, match candidates against job requirements, calculate multi-factor scores, identify skill gaps, and provide honest, transparent hiring recommendations.

---

## 2. Problem Statement & Motivation
1. **Keyword Bias:** Traditional ATS systems discard great candidates if their resume uses synonyms (e.g. "PostgreSQL" vs "SQL", "Docker" vs "Containers").
2. **Black-Box Scoring:** Recruiters don't know *why* an AI gave a candidate a specific score.
3. **Unconscious Demographic Bias:** Names, genders, locations, and photos often influence first-round screening unconsciously.
4. **Lack of Candidate Feedback:** Rejected applicants receive generic rejection emails with no guidance on what skills were missing or how to bridge the gap.

---

## 3. System Architecture & Workflow

1. **Document Ingestion:** Candidate resumes (PDF / DOCX / TXT) are parsed using PyMuPDF and python-docx.
2. **NLP Extraction:** Extracts sections (Experience, Projects, Education, Skills) and sentence-level evidence.
3. **Semantic Skill Graph:** Matches extracted competencies against JD requirements using a NetworkX graph with 50+ technical concepts and directional relationships (implies, related_to, alternative_to).
4. **Multi-Factor Scoring:** Computes a weighted overall score:
   - Technical Skills: 45%
   - Experience Relevance: 35%
   - Growth & Learning Potential: 20%
5. **Claims & Evidence Verification:** Flags high-impact metrics (e.g. "Scaled to 10M users") and verifies supporting details.
6. **Decision & Shortlisting:** Recruiters can shortlist candidates with 1 click, filter results, and export CSV reports.

---

## 4. Key Features Delivered

1. **Multi-Resume Upload:** Drag-and-drop or select multiple resumes (PDF, DOCX, TXT) at once.
2. **Job Description Analyzer:** Auto-extracts required skills, experience thresholds, and audits non-inclusive language.
3. **Semantic Match Scoring:** Evaluates exact and transferable skills (e.g. Docker bridging to Kubernetes).
4. **Missing Skill Detection:** Visual alert tags highlighting exact gaps between candidate experience and job criteria.
5. **AI Resume Summary:** 2-3 sentence executive summary for fast recruiter evaluations.
6. **Explainable AI Recommendations:** Clear rationale explaining why each candidate earned their score.
7. **Verbatim Evidence Trails:** Expandable cards showing the exact sentence quotes extracted from the resume.
8. **Blind Screening Mode:** 1-click toggle to anonymize names, photos, and locations to eliminate unconscious bias.
9. **What-If Simulator:** Sliders allowing recruiters to adjust factor weights and watch rankings re-sort live.
10. **Shortlist & CSV Export:** Interactive shortlisting with one-click export for hiring committees.

---

## 5. Technology Stack Summary

| Layer | Technologies Used | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Modern CSS3 | Responsive Single-Page Application (SPA) |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic v2 | High-throughput asynchronous REST API |
| **Document Processing** | PyMuPDF (fitz), python-docx | Text & layout extraction from PDF and Word files |
| **NLP & Graph** | NetworkX, Heuristic Entity Linking | Semantic skill relationships & ontology mapping |
| **Database** | SQLAlchemy 2.0, PostgreSQL (psycopg2) / SQLite | Persistent candidate, job, and resume storage |
| **Security & Auth** | Passlib (bcrypt), python-jose (JWT) | Role-based authentication (Candidate vs Recruiter) |

---

## 6. How to Explain Your Project to Your Friends / Professor (3-Minute Presentation Script)

### Step 1: Start with the Problem (30 seconds)
> *"Every company receives hundreds of resumes. Most companies use basic keyword filters that reject great people just because they didn't use the exact buzzwords. And traditional screening introduces bias based on candidate names or universities."*

### Step 2: Show the AI Resume Screener (1 minute)
> *"In our project, HireLens AI, recruiters can upload multiple resumes at once—PDF or Word docs—and paste any job description. When we click 'Run AI Resume Screening', our backend uses Natural Language Processing and a semantic Skill Graph to understand related skills. For example, if someone knows Docker, our system understands they can easily adapt to Kubernetes."*

### Step 3: Show the Explainability & Ranking (1 minute)
> *"Candidates are automatically ranked with an overall score, an AI-generated summary, green matched skills, and red missing skills. Nothing is hidden: clicking 'View Evidence' shows the exact sentences from the resume that proved their skills."*

### Step 4: Show Responsible AI (30 seconds)
> *"Finally, we included a **Blind Screening Mode** that masks names and locations to ensure fairness, a **What-If Simulator** to adjust priorities, and a **1-click Shortlist** button to export the final candidates as a CSV report."*
