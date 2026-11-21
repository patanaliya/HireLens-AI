"""
HireLens AI - Document Parser & PII Anonymizer
Extracts clean text and structural sections from PDF, DOCX, and TXT resumes.
Supports F7 Blind Screening Mode by stripping PII (names, contact details, links).
"""

import re
from pathlib import Path
from typing import Dict, List, Any
import fitz  # PyMuPDF
from docx import Document


class ResumeParser:
    """Extracts text, structural sections, and sentences from resumes."""

    # Section header heuristics
    SECTION_PATTERNS = {
        "experience": re.compile(r"^(work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history)", re.IGNORECASE),
        "projects": re.compile(r"^(projects|personal\s+projects|academic\s+projects|technical\s+projects)", re.IGNORECASE),
        "skills": re.compile(r"^(skills|technical\s+skills|core\s+competencies|technologies|tools\s+&\s+technologies)", re.IGNORECASE),
        "education": re.compile(r"^(education|academic\s+background|qualifications)", re.IGNORECASE),
        "certifications": re.compile(r"^(certifications|licenses|courses|awards)", re.IGNORECASE),
        "summary": re.compile(r"^(summary|professional\s+summary|profile|about\s+me)", re.IGNORECASE)
    }

    @staticmethod
    def extract_text(file_path: Path) -> str:
        """Extracts text content depending on file type."""
        ext = file_path.suffix.lower()
        if ext == ".pdf":
            text = ""
            with fitz.open(file_path) as pdf:
                for page in pdf:
                    text += page.get_text() + "\n"
            return text.strip()
        elif ext == ".docx":
            doc = Document(file_path)
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @classmethod
    def segment_sections(cls, raw_text: str) -> Dict[str, str]:
        """Segments raw resume text into logical sections."""
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        sections: Dict[str, List[str]] = {
            "summary": [],
            "experience": [],
            "projects": [],
            "skills": [],
            "education": [],
            "certifications": [],
            "other": []
        }

        current_section = "other"

        for line in lines:
            # Check if line matches a known section header
            matched_section = None
            clean_line = re.sub(r"[:\-_#*]", "", line).strip()

            if len(clean_line.split()) <= 4:
                for sec_name, pattern in cls.SECTION_PATTERNS.items():
                    if pattern.match(clean_line):
                        matched_section = sec_name
                        break

            if matched_section:
                current_section = matched_section
            else:
                sections[current_section].append(line)

        return {k: "\n".join(v) for k, v in sections.items() if v}

    @staticmethod
    def extract_sentences(raw_text: str) -> List[str]:
        """Splits resume text into clean sentences for evidence linking."""
        # Clean bullets and extra whitespaces
        cleaned = re.sub(r"[\u2022\u25cf\u25aa\u25b6\-\*]\s*", "", raw_text)
        sentences = re.split(r"(?<=[.!?])\s+|\n+", cleaned)
        return [s.strip() for s in sentences if len(s.strip()) > 15]

    @staticmethod
    def anonymize_text(raw_text: str, candidate_name: str = "") -> str:
        """
        F7: Blind Screening Anonymizer.
        Strips emails, phone numbers, URLs, and candidate names to prevent unconscious bias.
        """
        anonymized = raw_text

        # 1. Mask Emails first (to prevent bracket insertion from corrupting email pattern)
        anonymized = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[EMAIL_MASKED]", anonymized)

        # 2. Mask Phone Numbers
        anonymized = re.sub(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", "[PHONE_MASKED]", anonymized)

        # 3. Mask LinkedIn & GitHub URLs
        anonymized = re.sub(r"(https?://)?(www\.)?(linkedin\.com/in|github\.com)/[a-zA-Z0-9_-]+", "[PROFILE_MASKED]", anonymized, flags=re.IGNORECASE)

        # 4. Mask Candidate Name if provided
        if candidate_name and len(candidate_name.strip()) > 2:
            parts = candidate_name.strip().split()
            for part in parts:
                if len(part) > 2:
                    anonymized = re.sub(rf"\b{re.escape(part)}\b", "[CANDIDATE]", anonymized, flags=re.IGNORECASE)

        return anonymized
