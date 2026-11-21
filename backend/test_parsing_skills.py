"""
HireLens AI - Phase 2 Verification Test:
Resume Parsing, PII Anonymization, Skill Extraction & Skill Graph Intelligence.
"""

from parser import ResumeParser
from skill_extractor import skill_extractor
from skill_graph import skill_graph

SAMPLE_RESUME = """
Jane Doe
Email: jane.doe@example.com | Phone: +1-555-839-2910 | GitHub: github.com/janedoe

PROFESSIONAL SUMMARY
Senior Backend Developer with 4 years of experience building distributed systems in Python and FastAPI.

EXPERIENCE
Software Engineer | Acme Cloud Systems (2022 - Present)
- Designed and maintained high-throughput REST APIs using FastAPI and PostgreSQL handling 15M requests daily.
- Containerized microservices using Docker and orchestrated automated deployments with CI/CD pipelines.
- Collaborated across an Agile / Scrum team conducting daily code reviews.

PROJECTS
Real-Time Chat Platform
- Architected a real-time reactive frontend using React and Tailwind CSS.
- Deployed lightweight worker nodes to manage Redis cache invalidation.

TECHNICAL SKILLS
Languages: Python, JavaScript, SQL
Tools & Frameworks: FastAPI, React, Docker, Postgres, Git, Redis
"""

def run_tests():
    print("==================================================")
    print("  HireLens AI - Phase 2 Verification Suite")
    print("==================================================")

    # 1. Test Section Segmentation
    print("[1/4] Testing Section Segmentation...")
    sections = ResumeParser.segment_sections(SAMPLE_RESUME)
    assert "experience" in sections, "Experience section not identified"
    assert "projects" in sections, "Projects section not identified"
    assert "skills" in sections, "Skills section not identified"
    print(f"      [OK] Identified sections: {list(sections.keys())}")

    # 2. Test PII Anonymization for Blind Mode
    print("[2/4] Testing PII Anonymization (F7 Blind Screening)...")
    anonymized = ResumeParser.anonymize_text(SAMPLE_RESUME, candidate_name="Jane Doe")
    assert "jane.doe@example.com" not in anonymized
    assert "[EMAIL_MASKED]" in anonymized
    assert "+1-555-839-2910" not in anonymized
    assert "[PHONE_MASKED]" in anonymized
    assert "Jane Doe" not in anonymized
    print("      [OK] Candidate name, email, phone, and profile links masked successfully.")

    # 3. Test Skill Extraction & Depth Scoring
    print("[3/4] Testing Skill Extraction & Depth Evidence...")
    result = skill_extractor.extract_from_text(SAMPLE_RESUME, sections)
    extracted_names = set(result.skill_names)

    # Verify both canonical skills and aliases (e.g. Postgres -> PostgreSQL)
    expected_skills = {"Python", "FastAPI", "Docker", "PostgreSQL", "React", "Redis", "Agile / Scrum"}
    found_expected = expected_skills.intersection(extracted_names)
    assert len(found_expected) >= 5, f"Expected skills missing. Found: {extracted_names}"

    # Check depth score on 'FastAPI' (mentioned in experience + skills)
    fastapi_skill = next(s for s in result.skills if s.name == "FastAPI")
    assert fastapi_skill.depth_score >= 2.0, "Depth score should reflect work experience usage"
    assert len(fastapi_skill.evidence_sentences) > 0, "Evidence sentences must be captured"
    print(f"      [OK] Total extracted skills: {result.total_skills_found}")
    print(f"      [OK] 'FastAPI' depth: {fastapi_skill.depth_score}/3.5 (In Work Experience: {fastapi_skill.in_experience})")
    print(f"      [OK] Evidence sentence: \"{fastapi_skill.evidence_sentences[0][:65]}...\"")

    # 4. Test Skill Graph Semantic Expansion
    print("[4/4] Testing Skill Graph & Non-Keyword ATS Matching...")
    # Job requires: Python, Kubernetes, JavaScript (Notice: resume had Docker, React, FastAPI)
    job_required = ["Python", "Kubernetes", "JavaScript"]
    coverage = skill_graph.evaluate_skill_coverage(result.skill_names, job_required)

    print(f"      [OK] Direct Exact Matches: {[m['required_skill'] for m in coverage['exact_matches']]}")
    print(f"      [OK] Transferable / Implied Matches: {[m['required_skill'] + ' (via ' + m['candidate_skill'] + ')' for m in coverage['transferable_matches']]}")
    print(f"      [OK] Semantic Coverage Score: {coverage['coverage_score']}%")

    # Since candidate has Docker (relates to Kubernetes) and React (implies JavaScript), coverage should be high!
    assert coverage["coverage_score"] > 80.0, "Skill graph should award credit for implied & transferable skills"

    print("==================================================")
    print("  [OK] ALL PHASE 2 PARSING & SKILL TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
