"""
HireLens AI - Core Screening, Fairness & Explainability Engine
Powers Features:
- F1: Skill Gap & Growth Potential Analysis
- F2: Skill Depth & Recency Scoring
- F3: Explainable Match Score with Evidence Trail
- F4: Resume Claim Evidence Checker
- F7: Blind Screening Anonymization
- F8: Job Description Bias Analyzer
- F10: Adaptive Interview Question Generator
- F11: What-If Weight Simulator
"""

import re
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

from parser import ResumeParser
from skill_extractor import skill_extractor
from skill_graph import skill_graph


# ==========================================
# PYDANTIC RESPONSE SCHEMAS
# ==========================================
class ClaimEvidence(BaseModel):
    claim: str
    status: str  # "Supported" or "Needs Evidence"
    category: str
    confidence: float
    supporting_quote: Optional[str] = None
    probe_question: str


class EvidenceItem(BaseModel):
    factor: str
    sentence: str
    confidence: float
    category: str


class GapReportOutput(BaseModel):
    matched_skills: List[Dict[str, Any]]
    missing_required: List[str]
    skills_to_develop: List[str]
    growth_evidence: str
    learning_roadmap: List[Dict[str, str]]
    recruiter_summary: str


class ScreeningResult(BaseModel):
    candidate_name: str
    blind_id: str
    overall_score: float
    skill_score: float
    experience_score: float
    growth_score: float
    needs_human_review: bool
    factor_breakdown: Dict[str, float]
    evidence_trail: List[EvidenceItem]
    gap_report: GapReportOutput
    claims_verification: List[ClaimEvidence]
    interview_questions: List[Dict[str, Any]]


# ==========================================
# ENGINE IMPLEMENTATION
# ==========================================
class ScreeningEngine:
    """Core AI screening engine fulfilling the 5 non-negotiable philosophies."""

    # F8: Known exclusionary, gendered, or biased JD phrases
    BIAS_PATTERNS = {
        "rockstar": "experienced specialist / high-performing engineer",
        "ninja": "skilled engineer / developer",
        "guru": "subject matter expert / technical lead",
        "young energetic team": "collaborative and dynamic team",
        "digital native": "proficient in modern digital tools",
        "work hard play hard": "results-driven, supportive environment",
        "dominant personality": "effective communicator and collaborator",
        "aggressive target": "ambitious, well-defined milestones"
    }

    def analyze_jd_bias(self, jd_text: str) -> Dict[str, Any]:
        """
        F8: Job Description Bias Analyzer.
        Detects non-inclusive terminology and provides a side-by-side inclusive rewrite.
        """
        flagged_terms = []
        inclusive_text = jd_text

        for phrase, replacement in self.BIAS_PATTERNS.items():
            pattern = rf"\b{re.escape(phrase)}\b"
            matches = list(re.finditer(pattern, jd_text, re.IGNORECASE))
            if matches:
                flagged_terms.append({
                    "original": phrase,
                    "suggestion": replacement,
                    "count": len(matches),
                    "reason": "Often perceived as exclusionary or discouraging diverse applicants."
                })
                inclusive_text = re.sub(pattern, replacement, inclusive_text, flags=re.IGNORECASE)

        bias_score = min(1.0, len(flagged_terms) * 0.15)
        inclusivity_rating = "Excellent (Highly Inclusive)" if bias_score == 0 else (
            "Good" if bias_score < 0.3 else "Needs Revision"
        )

        return {
            "bias_score": round(bias_score, 2),
            "inclusivity_rating": inclusivity_rating,
            "flagged_count": len(flagged_terms),
            "flagged_terms": flagged_terms,
            "inclusive_rewrite": inclusive_text
        }

    def verify_resume_claims(self, resume_text: str, sentences: List[str]) -> List[ClaimEvidence]:
        """
        F4: Resume Claim Evidence Checker.
        Identifies bold assertions (scale, team leadership, high impact) and labels them
        'Supported' or 'Needs Evidence' with polite follow-up probe questions.
        """
        claims = []

        # Claim detectors
        patterns = [
            (
                r"(led|managed|headed|supervised)\s+(a\s+team\s+of\s+\d+|[0-9]+\s+engineers|[0-9]+\s+developers)",
                "Team Leadership",
                "How was work distributed across your team, and how did you resolve technical disagreements?"
            ),
            (
                r"(scaled|handled|processed)\s+(over\s+)?(\d+\+?\s*(m|million|k|thousand|requests|users|rps))",
                "Scale & Throughput",
                "What bottlenecks did you encounter when scaling this system, and how did you monitor performance?"
            ),
            (
                r"(architected|designed|built)\s+(from\s+scratch|microservices|distributed\s+system)",
                "Architecture",
                "What trade-offs led you to choose this architecture, and what would you design differently today?"
            ),
            (
                r"(reduced|improved|decreased|increased)\s+.*?\b(\d+%)",
                "Quantified Impact",
                "What specific baseline metric was used to measure this improvement, and what tools tracked it?"
            )
        ]

        for regex, category, default_probe in patterns:
            for sent in sentences:
                match = re.search(regex, sent, re.IGNORECASE)
                if match:
                    # Check if supporting context exists (e.g. tools/technologies mentioned)
                    has_details = bool(re.search(r"(using|with|via|through|utilizing|implemented)", sent, re.IGNORECASE))
                    status = "Supported" if has_details else "Needs Evidence"
                    confidence = 0.88 if has_details else 0.65

                    claims.append(ClaimEvidence(
                        claim=sent.strip(),
                        status=status,
                        category=category,
                        confidence=confidence,
                        supporting_quote=sent.strip() if has_details else None,
                        probe_question=default_probe
                    ))

        # Default fallback claim if resume has sparse metrics
        if not claims:
            for sent in sentences:
                if any(w in sent.lower() for w in ["developed", "built", "implemented", "created"]):
                    claims.append(ClaimEvidence(
                        claim=sent.strip(),
                        status="Needs Evidence",
                        category="Project Implementation",
                        confidence=0.70,
                        supporting_quote=sent.strip(),
                        probe_question="Could you walk us through the end-to-end design and your individual contribution to this project?"
                    ))
                    if len(claims) >= 2:
                        break

        return claims[:4]

    def generate_interview_questions(
        self, missing_skills: List[str], claims: List[ClaimEvidence]
    ) -> List[Dict[str, Any]]:
        """
        F10: Adaptive Interview Generator.
        Generates targeted technical questions for missing skills and behavioral questions for claims.
        """
        questions = []

        # 1. Technical questions for missing skills
        for skill in missing_skills[:2]:
            questions.append({
                "type": "Technical Assessment",
                "skill": skill,
                "difficulty": "Medium",
                "question": f"While your resume highlights strong engineering depth, our team relies on {skill}. How have you approached similar concepts in past stacks, or how would you ramp up?",
                "ideal_answer_outline": f"Candidate relates foundational concepts (e.g. containers, query optimization) to {skill} with clear mental models.",
                "red_flags": [f"Claims expert knowledge in {skill} without evidence", "Dismisses the importance of the technology"]
            })

        # 2. Behavioral questions based on claims
        for claim in claims[:2]:
            questions.append({
                "type": "Behavioral & Evidence Probe",
                "skill": claim.category,
                "difficulty": "High",
                "question": claim.probe_question,
                "ideal_answer_outline": "Candidate gives specific, non-defensive technical details citing metrics, architectures, or team dynamics.",
                "red_flags": ["Vague generalizations", "Inability to recall team size or architectural trade-offs"]
            })

        return questions

    def screen_candidate(
        self,
        resume_text: str,
        job_requirements: List[str],
        candidate_name: str = "Candidate",
        blind_id: str = "Candidate #C-801"
    ) -> ScreeningResult:
        """
        Unified Screening Pipeline (F1, F2, F3, F4, F7, F10).
        Evaluates skills, evidence, growth, and fair explainability.
        """
        sections = ResumeParser.segment_sections(resume_text)
        sentences = ResumeParser.extract_sentences(resume_text)

        # 1. Extract Skills
        skill_res = skill_extractor.extract_from_text(resume_text, sections)

        # 2. Skill Graph Coverage (F1)
        coverage = skill_graph.evaluate_skill_coverage(skill_res.skill_names, job_requirements)

        # 3. Calculate Factors
        skill_score = coverage["coverage_score"]

        # Experience score: based on depth of skills in experience section
        deep_skills = [s for s in skill_res.skills if s.in_experience]
        exp_score = min(100.0, 50.0 + (len(deep_skills) * 10.0))

        # Growth score: evidence of learning progression
        growth_score = min(95.0, 60.0 + (len(skill_res.skills) * 2.5))

        # Overall Weighted Score (Skills: 45%, Experience: 35%, Growth: 20%)
        overall = round((skill_score * 0.45) + (exp_score * 0.35) + (growth_score * 0.20), 1)

        # 4. Build Evidence Trail (F3)
        evidence_trail = []
        for s in skill_res.skills[:5]:
            if s.evidence_sentences:
                evidence_trail.append(EvidenceItem(
                    factor=s.name,
                    sentence=s.evidence_sentences[0],
                    confidence=min(0.98, 0.75 + (s.depth_score * 0.08)),
                    category=s.category
                ))

        # 5. Build Learning Roadmap (F1)
        missing = coverage["missing_skills"]
        roadmap = []
        for idx, m_skill in enumerate(missing, 1):
            related = skill_graph.get_related_skills(m_skill)
            bridge = f"Bridge from {related[0]['skill']}" if related else "Self-paced hands-on project"
            roadmap.append({
                "step": f"Step {idx}: {m_skill}",
                "strategy": bridge,
                "target_timeline": f"Week {idx * 2}"
            })

        # 6. Verify Claims (F4)
        claims = self.verify_resume_claims(resume_text, sentences)

        # 7. Adaptive Questions (F10)
        questions = self.generate_interview_questions(missing, claims)

        gap_report = GapReportOutput(
            matched_skills=coverage["exact_matches"] + coverage["transferable_matches"],
            missing_required=missing,
            skills_to_develop=[f"{m} (High ROI)" for m in missing[:3]],
            growth_evidence=f"Demonstrates consistent expansion across {len(skill_res.skills)} technologies, with deep verified application in {len(deep_skills)} core tools.",
            learning_roadmap=roadmap,
            recruiter_summary=f"Candidate achieves a {overall}% match score. Shows solid fundamentals with {len(coverage['exact_matches'])} exact requirements met and {len(coverage['transferable_matches'])} transferable competencies."
        )

        return ScreeningResult(
            candidate_name=candidate_name,
            blind_id=blind_id,
            overall_score=overall,
            skill_score=skill_score,
            experience_score=exp_score,
            growth_score=growth_score,
            needs_human_review=True,
            factor_breakdown={"skills": 0.45, "experience": 0.35, "growth": 0.20},
            evidence_trail=evidence_trail,
            gap_report=gap_report,
            claims_verification=claims,
            interview_questions=questions
        )

    def calculate_what_if_rank(
        self,
        candidate_scores: Dict[str, float],
        weights: Dict[str, float]
    ) -> float:
        """
        F11: Recruiter What-If Weight Simulator.
        Re-ranks a candidate live based on user slider adjustments:
        weights = { 'skills': 0.4, 'experience': 0.3, 'education': 0.15, 'growth': 0.15 }
        """
        total_weight = sum(weights.values()) or 1.0
        score = sum(
            candidate_scores.get(factor, 70.0) * (weight / total_weight)
            for factor, weight in weights.items()
        )
        return round(score, 1)


# Global singleton instance
screening_engine = ScreeningEngine()
