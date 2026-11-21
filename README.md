
# HireLens AI – Intelligent Resume Screening System

An AI-powered resume screening platform designed to help recruiters analyze, evaluate, and rank candidates based on job requirements using explainable skill matching and resume analysis.

## Overview

**HireLens AI** is a full-stack web application that streamlines the recruitment screening process.

Recruiters can upload multiple candidate resumes, provide job descriptions, define required skills, and evaluate candidates based on their qualifications and experience.

The system extracts information from resumes, identifies technical skills, analyzes skill relationships, and generates screening results to support more informed recruitment decisions.

The platform also includes explainable candidate evaluation, blind screening, job description bias analysis, and a what-if screening simulator.

## Key Features

### 1. AI-Powered Resume Screening
- Upload multiple candidate resumes.
- Extract information from uploaded documents.
- Compare candidate profiles against job descriptions.
- Evaluate candidates based on required skills and experience.
- Generate candidate screening results.

### 2. Intelligent Resume Parsing
- Supports PDF, DOCX, and TXT resume formats.
- Extracts candidate information and resume sections.
- Identifies education, experience, projects, and skills.
- Organizes extracted information for further analysis.

### 3. Skill Extraction and Analysis
- Automatically identifies technical skills.
- Normalizes skill names using aliases.
- Categorizes skills based on their domains.
- Extracts supporting sentences from resumes.
- Calculates skill-depth scores using frequency and section context.

### 4. Skill Relationship Intelligence
Uses a NetworkX-based skill ontology graph to identify:

- Exact skill matches.
- Directional skill implications.
- Related technologies.
- Alternative technologies.
- Explainable skill coverage.

### 5. Explainable Candidate Ranking
- Evaluates candidate skills against job requirements.
- Identifies matched and missing skills.
- Provides explanations for skill matches.
- Helps recruiters understand screening results.

### 6. Blind Resume Screening
Provides a blind-screening option intended to reduce exposure to selected personal information during candidate evaluation.

### 7. Job Description Bias Analyzer
Analyzes job descriptions to help identify potentially biased wording and improve inclusive recruitment practices.

### 8. What-If Screening Simulator
Allows recruiters to explore how changes in screening criteria and scoring weights can affect candidate evaluation.

### 9. Candidate Directory
Provides an organized interface for reviewing candidate information and screening results.

### 10. Authentication
Includes user registration and login functionality.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Frontend Build Tool | Vite |
| Backend | Python |
| Backend Framework | FastAPI |
| Database | SQLite |
| ORM | SQLAlchemy |
| Data Validation | Pydantic |
| Resume Parsing | PyMuPDF, python-docx |
| Skill Analysis | Python, Regular Expressions |
| Skill Relationship Graph | NetworkX |
| API Server | Uvicorn |

## System Architecture

```text
             RECRUITER
                 |
                 v
       REACT FRONTEND (VITE)
                 |
                 | REST API
                 v
          FASTAPI BACKEND
                 |
       +---------+----------+
       |         |          |
       v         v          v
    RESUME    SKILL      AUTHENTICATION
    PARSER   EXTRACTOR
       |         |
       v         v
   SECTION    SKILL GRAPH
   ANALYSIS   ANALYSIS
       |         |
       +----+----+
            |
            v
      SCREENING ENGINE
            |
            v
     EXPLAINABLE RESULTS
            |
            v
       SQLITE DATABASE
```

## Project Structure

```text
HireLens-AI/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── parser.py
│   ├── skill_extractor.py
│   ├── skill_graph.py
│   ├── screening_engine.py
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── sample_resumes/
│
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites

Install the following:

- Python 3.10+
- Node.js and npm
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/patanaliya/HireLens-AI.git
cd HireLens-AI
```

### 2. Backend Setup

Open a terminal:

```powershell
cd backend
```

Create a virtual environment:

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the required dependencies:

```powershell
pip install fastapi uvicorn sqlalchemy python-multipart pydantic pymupdf python-docx networkx
```

If a `requirements.txt` file is available, install dependencies using:

```powershell
pip install -r requirements.txt
```

Start the backend server:

```powershell
python -m uvicorn main:app --reload --port 8000
```

Backend URL:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### 3. Frontend Setup

Open another terminal:

```powershell
cd frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Open the local URL displayed by Vite, commonly:

http://localhost:5173/

Keep both frontend and backend servers running while using the application.

## Resume Screening Workflow

1. Recruiter registers or logs into HireLens AI.
2. Recruiter opens the AI Screener and Ranker.
3. Enters the target job title and job description.
4. Defines required skills and minimum experience.
5. Uploads candidate resumes.
6. The backend extracts text and identifies resume sections.
7. The skill extractor identifies candidate skills.
8. The skill graph analyzes relationships between candidate skills and job requirements.
9. The screening engine evaluates candidates.
10. Recruiter reviews screening results and available explanations.

## Resume Screening API

### Endpoint

`POST /api/screen-resumes`

The endpoint accepts multipart form data.

| Parameter | Description |
|---|---|
| `files` | Candidate resume files |
| `job_title` | Target job title |
| `job_description` | Job description |
| `required_skills` | Required technical skills |
| `min_experience` | Minimum experience requirement |
| `blind_mode` | Enables blind screening |
| `include_benchmarks` | Controls benchmark candidate inclusion |

For the complete API specification, visit:

http://127.0.0.1:8000/docs

## Skill Analysis Methodology

HireLens AI uses a skill extraction engine and a directed skill relationship graph.

### Skill Extraction

The system:
- Identifies skills from resume text.
- Recognizes common skill aliases.
- Categorizes extracted skills.
- Counts skill occurrences.
- Identifies whether skills appear in project or experience sections.
- Collects supporting evidence sentences.

### Skill Relationship Graph

The graph represents relationships such as:

- `implies`
- `related_to`
- `alternative_to`

This allows the system to analyze relationships between technologies instead of relying exclusively on exact keyword matching.

### Explainability

Screening results are intended to provide information about:
- Exact skill matches.
- Related or transferable skills.
- Missing job requirements.
- Supporting resume evidence.
- Skill coverage.

## Responsible AI and Fair Recruitment

HireLens AI is designed as a recruitment decision-support system.

Important considerations:

- Automated resume extraction can make mistakes.
- A keyword match does not prove practical skill proficiency.
- Related technologies should not automatically be treated as equivalent.
- Blind screening does not guarantee elimination of bias.
- Recruiters should verify candidate information against original resumes.
- Protected characteristics should not be used to rank candidates.
- Candidate resumes must be handled as confidential personal information.

Final recruitment decisions should always involve human review.

## Future Enhancements

- Advanced semantic resume matching.
- LLM-based requirement understanding.
- Improved evidence verification.
- Advanced bias and fairness evaluation.
- Candidate skill-gap analysis.
- Interview question generation.
- Resume-to-job compatibility explanations.
- Automated evaluation using benchmark datasets.

## Author

**Aliya**

GitHub: [patanaliya](https://github.com/patanaliya)

Project Repository:  
https://github.com/patanaliya/HireLens-AI

## License

Add a LICENSE file to specify the terms under which this project can be used and distributed.
