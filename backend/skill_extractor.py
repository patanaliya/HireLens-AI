"""
HireLens AI - Skill Extraction & Evidence Engine
Extracts technical and domain skills from raw resume or JD text.
Computes F2 Skill Depth (frequency, section context) and pairs every skill
with exact supporting sentences for F3 Evidence Trail.
"""

import re
from typing import Dict, List, Any, Set
from pydantic import BaseModel, Field
from parser import ResumeParser
from skill_graph import skill_graph


class ExtractedSkillInfo(BaseModel):
    name: str
    category: str
    depth_score: float = Field(..., description="Calculated depth: 1.0 (mentioned) to 3.0+ (demonstrated in projects/experience)")
    occurrences: int
    in_experience: bool
    in_projects: bool
    evidence_sentences: List[str] = Field(default_factory=list)


class SkillExtractionResult(BaseModel):
    total_skills_found: int
    skills: List[ExtractedSkillInfo]
    skill_names: List[str]
    by_category: Dict[str, List[str]]


class SkillExtractor:
    """Extracts skills, aliases, and supporting evidence quotes."""

    # Common aliases & abbreviations mapped to canonical skill names
    ALIASES = {
        "k8s": "Kubernetes",
        "kube": "Kubernetes",
        "js": "JavaScript",
        "es6": "JavaScript",
        "ts": "TypeScript",
        "py": "Python",
        "python3": "Python",
        "reactjs": "React",
        "react.js": "React",
        "nextjs": "Next.js",
        "vue": "Vue.js",
        "vuejs": "Vue.js",
        "nodejs": "Node.js",
        "node": "Node.js",
        "golang": "Go",
        "postgres": "PostgreSQL",
        "postgresql": "PostgreSQL",
        "mongo": "MongoDB",
        "tf": "Terraform",
        "aws": "AWS",
        "gcp": "GCP",
        "azure": "Azure",
        "fastapi": "FastAPI",
        "flask": "Flask",
        "django": "Django",
        "spring": "Spring Boot",
        "springboot": "Spring Boot",
        "docker": "Docker",
        "git": "Git",
        "github": "Git",
        "ci/cd": "CI/CD",
        "cicd": "CI/CD",
        "rest": "REST APIs",
        "restful": "REST APIs",
        "microservice": "Microservices",
        "microservices": "Microservices",
        "system design": "System Design",
        "scrum": "Agile / Scrum",
        "agile": "Agile / Scrum",
        "llm": "LLMs",
        "llms": "LLMs",
        "nlp": "NLP",
        "pytorch": "PyTorch",
        "tensorflow": "TensorFlow"
    }

    def __init__(self):
        # Build canonical vocabulary from skill graph plus known aliases
        self.canonical_skills = list(skill_graph.graph.nodes())

    def extract_from_text(self, text: str, sections: Dict[str, str] = None) -> SkillExtractionResult:
        """Extracts skills and evidence sentences from raw text and optional parsed sections."""
        if not sections:
            sections = ResumeParser.segment_sections(text)

        all_sentences = ResumeParser.extract_sentences(text)
        exp_text = sections.get("experience", "").lower()
        proj_text = sections.get("projects", "").lower()

        found_skills: Dict[str, Dict[str, Any]] = {}

        # 1. Match Canonical Skills
        for skill in self.canonical_skills:
            pattern = rf"(?<!\w){re.escape(skill.lower())}(?!\w)"
            matches = list(re.finditer(pattern, text, re.IGNORECASE))

            if matches:
                category = skill_graph.graph.nodes[skill].get("category", "general")
                found_skills[skill] = {
                    "name": skill,
                    "category": category,
                    "occurrences": len(matches),
                    "in_experience": bool(re.search(pattern, exp_text)),
                    "in_projects": bool(re.search(pattern, proj_text)),
                    "evidence_sentences": []
                }

        # 2. Match Aliases
        for alias, canonical in self.ALIASES.items():
            pattern = rf"(?<!\w){re.escape(alias.lower())}(?!\w)"
            matches = list(re.finditer(pattern, text, re.IGNORECASE))

            if matches:
                category = skill_graph.graph.nodes[canonical].get("category", "general")
                if canonical not in found_skills:
                    found_skills[canonical] = {
                        "name": canonical,
                        "category": category,
                        "occurrences": len(matches),
                        "in_experience": bool(re.search(pattern, exp_text)),
                        "in_projects": bool(re.search(pattern, proj_text)),
                        "evidence_sentences": []
                    }
                else:
                    found_skills[canonical]["occurrences"] += len(matches)
                    if bool(re.search(pattern, exp_text)):
                        found_skills[canonical]["in_experience"] = True
                    if bool(re.search(pattern, proj_text)):
                        found_skills[canonical]["in_projects"] = True

        # 3. Associate Evidence Sentences (F3 Evidence Trail)
        for skill_name, info in found_skills.items():
            pattern = rf"(?<!\w){re.escape(skill_name.lower())}(?!\w)"
            evidence = []
            for sent in all_sentences:
                if re.search(pattern, sent, re.IGNORECASE):
                    evidence.append(sent)
                if len(evidence) >= 3:
                    break

            info["evidence_sentences"] = evidence

            # Calculate F2 Depth Score:
            # Base 1.0; +0.5 for multiple mentions; +0.8 if in projects; +1.0 if in work experience
            depth = 1.0
            if info["occurrences"] > 1:
                depth += 0.5
            if info["in_projects"]:
                depth += 0.8
            if info["in_experience"]:
                depth += 1.0
            info["depth_score"] = round(min(depth, 3.5), 1)

        # 4. Format into structured Result
        skills_list = [
            ExtractedSkillInfo(**data)
            for data in sorted(found_skills.values(), key=lambda x: (x["depth_score"], x["occurrences"]), reverse=True)
        ]

        by_cat: Dict[str, List[str]] = {}
        for s in skills_list:
            by_cat.setdefault(s.category, []).append(s.name)

        return SkillExtractionResult(
            total_skills_found=len(skills_list),
            skills=skills_list,
            skill_names=[s.name for s in skills_list],
            by_category=by_cat
        )


# Global singleton instance
skill_extractor = SkillExtractor()
