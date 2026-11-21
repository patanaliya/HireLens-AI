
"""
HireLens AI - Document Parser & PII Anonymizer

Extracts clean text and structural sections from PDF, DOCX, and TXT resumes.
Supports blind screening by masking personal information.
"""

import re
from pathlib import Path
from typing import Dict, List
from io import BytesIO

import fitz
import pytesseract
from PIL import Image
from docx import Document

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

class ResumeParser:
    """Extracts text, structural sections, and sentences from resumes."""

    SECTION_PATTERNS = {
        "experience": re.compile(
            r"^(work\s+experience|professional\s+experience|"
            r"experience|employment\s+history|work\s+history|"
            r"internship\s*/\s*experience)$",
            re.IGNORECASE
        ),
        "projects": re.compile(
            r"^(projects|personal\s+projects|academic\s+projects|"
            r"technical\s+projects)$",
            re.IGNORECASE
        ),
        "skills": re.compile(
            r"^(skills|technical\s+skills|core\s+competencies|"
            r"technologies|tools\s*&\s*technologies)$",
            re.IGNORECASE
        ),
        "education": re.compile(
            r"^(education|academic\s+background|qualifications)$",
            re.IGNORECASE
        ),
        "certifications": re.compile(
            r"^(certifications|licenses|courses|awards)$",
            re.IGNORECASE
        ),
        "summary": re.compile(
            r"^(summary|professional\s+summary|profile|about\s+me)$",
            re.IGNORECASE
        )
    }

        @staticmethod
    def extract_text(file_path: Path) -> str:
        """Extract text from PDF, DOCX, or TXT files.
        Uses OCR for scanned PDF pages.
        """

        ext = file_path.suffix.lower()

        if ext == ".pdf":
            extracted_pages = []

            with fitz.open(file_path) as pdf:
                for page in pdf:
                    page_text = page.get_text().strip()

                    # OCR fallback for scanned PDF pages
                    if not page_text:
                        pix = page.get_pixmap(
                            matrix=fitz.Matrix(2, 2),
                            alpha=False
                        )

                        image = Image.open(
                            BytesIO(pix.tobytes("png"))
                        )

                        page_text = pytesseract.image_to_string(
                            image,
                            lang="eng"
                        ).strip()

                    extracted_pages.append(page_text)

            return "\n".join(extracted_pages).strip()

        elif ext == ".docx":
            doc = Document(file_path)
            return "\n".join(
                p.text for p in doc.paragraphs if p.text.strip()
            )

        elif ext == ".txt":
            with open(
                file_path, "r", encoding="utf-8", errors="ignore"
            ) as f:
                return f.read().strip()

        else:
            raise ValueError(f"Unsupported file format: {ext}")
    @classmethod
    def segment_sections(cls, raw_text: str) -> Dict[str, str]:
        """Divide resume text into logical sections."""

        lines = [
            line.strip()
            for line in raw_text.splitlines()
            if line.strip()
        ]

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

            matched_section = None

            clean_line = re.sub(
                r"[:#*_]",
                "",
                line
            ).strip()

            clean_line = re.sub(r"[-]+$", "", clean_line).strip()

            if len(clean_line.split()) <= 5:
                for sec_name, pattern in cls.SECTION_PATTERNS.items():
                    if pattern.fullmatch(clean_line):
                        matched_section = sec_name
                        break

            if matched_section:
                current_section = matched_section
            else:
                sections[current_section].append(line)

        return {
            key: "\n".join(value)
            for key, value in sections.items()
            if value
        }

    @staticmethod
    def extract_sentences(raw_text: str) -> List[str]:
        """Split resume text into sentences for evidence linking."""

        cleaned = re.sub(
            r"[\u2022\u25cf\u25aa\u25b6]",
            "",
            raw_text
        )

        cleaned = re.sub(r"(?m)^\s*[-*]\s*", "", cleaned)

        sentences = re.split(
            r"(?<=[.!?])\s+|\n+",
            cleaned
        )

        return [
            sentence.strip()
            for sentence in sentences
            if len(sentence.strip()) > 15
        ]

    @staticmethod
    def anonymize_text(
        raw_text: str,
        candidate_name: str = ""
    ) -> str:
        """
        Blind Screening:
        Masks email addresses, phone numbers, profile URLs,
        and candidate names.
        """

        anonymized = raw_text

        # 1. Mask email addresses
        anonymized = re.sub(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
            "[EMAIL_MASKED]",
            anonymized
        )

        # 2. Mask phone numbers
        anonymized = re.sub(
            r"(?<!\w)(?:\+?\d{1,3}[-.\s]?)?"
            r"(?:\(?\d{3,5}\)?[-.\s]?)"
            r"\d{3,5}[-.\s]?\d{3,5}(?!\w)",
            "[PHONE_MASKED]",
            anonymized
        )

        # 3. Mask LinkedIn and GitHub URLs
        anonymized = re.sub(
            r"(?:https?://)?(?:www\.)?"
            r"(?:linkedin\.com/in|github\.com)/"
            r"[A-Za-z0-9_-]+/?",
            "[PROFILE_MASKED]",
            anonymized,
            flags=re.IGNORECASE
        )

        # 4. Mask candidate name
        if candidate_name and len(candidate_name.strip()) > 2:
            name_pattern = re.escape(candidate_name.strip())

            anonymized = re.sub(
                rf"\b{name_pattern}\b",
                "[CANDIDATE]",
                anonymized,
                flags=re.IGNORECASE
            )

        return anonymized
