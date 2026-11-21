"""
HireLens AI - Skill Relationship Intelligence & Ontology Graph
Implements non-keyword ATS intelligence:
- Directional implications (Spring Boot -> Java, React -> JavaScript)
- Semantic relatedness (Docker <-> Kubernetes, FastAPI <-> Flask)
- Transferable skill detection (AWS -> GCP, PostgreSQL -> MySQL)
"""

from typing import Dict, List, Set, Tuple, Optional, Any
import networkx as nx


class SkillGraph:
    """Directed Skill Graph & Ontology Engine."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self._initialize_ontology()

    def _initialize_ontology(self):
        """Seeds curated technical and soft skills with weighted relationships."""

        # Master Skill Categories
        skills_data = {
            # Languages
            "Python": "language", "JavaScript": "language", "TypeScript": "language",
            "Java": "language", "C++": "language", "C#": "language", "Go": "language",
            "Rust": "language", "SQL": "language", "HTML": "language", "CSS": "language",

            # Frameworks & Libraries
            "FastAPI": "framework", "Flask": "framework", "Django": "framework",
            "React": "framework", "Next.js": "framework", "Vue.js": "framework",
            "Angular": "framework", "Node.js": "framework", "Express.js": "framework",
            "Spring Boot": "framework", ".NET": "framework", "Tailwind CSS": "framework",

            # Databases & Storage
            "PostgreSQL": "database", "MySQL": "database", "MongoDB": "database",
            "Redis": "database", "Elasticsearch": "database", "DynamoDB": "database",
            "SQLite": "database",

            # Cloud & DevOps
            "Docker": "devops", "Kubernetes": "devops", "AWS": "cloud", "GCP": "cloud",
            "Azure": "cloud", "Terraform": "devops", "CI/CD": "devops", "Git": "tools",
            "Linux": "os", "Nginx": "devops",

            # Data & AI/ML
            "PyTorch": "ai_ml", "TensorFlow": "ai_ml", "Machine Learning": "ai_ml",
            "Pandas": "data", "NumPy": "data", "Scikit-Learn": "ai_ml", "NLP": "ai_ml",
            "LLMs": "ai_ml", "Vector Databases": "ai_ml",

            # Soft Skills & Leadership
            "Team Leadership": "soft", "Agile / Scrum": "methodology", "System Design": "architecture",
            "Code Review": "practices", "Microservices": "architecture", "REST APIs": "architecture"
        }

        for skill, category in skills_data.items():
            self.graph.add_node(skill, category=category)

        # Directional Relations (Source implies/relates to Target with weight)
        # Type: 'implies' (strong parent language/concept), 'related_to', 'alternative_to'
        edges = [
            # Implication edges (weight ~ 0.95)
            ("Spring Boot", "Java", "implies", 0.95),
            ("Spring Boot", "REST APIs", "implies", 0.90),
            ("Django", "Python", "implies", 0.95),
            ("FastAPI", "Python", "implies", 0.95),
            ("Flask", "Python", "implies", 0.95),
            ("Next.js", "React", "implies", 0.95),
            ("Next.js", "JavaScript", "implies", 0.95),
            ("React", "JavaScript", "implies", 0.95),
            ("Express.js", "Node.js", "implies", 0.95),
            ("Node.js", "JavaScript", "implies", 0.95),
            ("TypeScript", "JavaScript", "implies", 0.90),
            ("PyTorch", "Python", "implies", 0.95),
            ("PyTorch", "Machine Learning", "implies", 0.90),
            ("Pandas", "Python", "implies", 0.95),
            ("Tailwind CSS", "CSS", "implies", 0.95),

            # Related tech stack edges (weight ~ 0.70 - 0.85)
            ("Docker", "Kubernetes", "related_to", 0.80),
            ("Kubernetes", "Docker", "related_to", 0.85),
            ("Microservices", "Docker", "related_to", 0.75),
            ("FastAPI", "REST APIs", "related_to", 0.90),
            ("FastAPI", "Microservices", "related_to", 0.75),
            ("PostgreSQL", "SQL", "implies", 0.95),
            ("MySQL", "SQL", "implies", 0.95),
            ("CI/CD", "Git", "related_to", 0.80),
            ("CI/CD", "Docker", "related_to", 0.75),
            ("LLMs", "Vector Databases", "related_to", 0.80),
            ("LLMs", "NLP", "related_to", 0.85),

            # Transferable alternative edges (weight ~ 0.70 - 0.80)
            ("AWS", "GCP", "alternative_to", 0.75),
            ("GCP", "AWS", "alternative_to", 0.75),
            ("AWS", "Azure", "alternative_to", 0.75),
            ("PostgreSQL", "MySQL", "alternative_to", 0.80),
            ("MySQL", "PostgreSQL", "alternative_to", 0.80),
            ("React", "Vue.js", "alternative_to", 0.75),
            ("Vue.js", "React", "alternative_to", 0.75),
            ("FastAPI", "Flask", "alternative_to", 0.80),
            ("Flask", "FastAPI", "alternative_to", 0.80)
        ]

        for source, target, rel_type, weight in edges:
            self.graph.add_edge(source, target, relation_type=rel_type, weight=weight)

    def get_related_skills(self, skill_name: str, min_weight: float = 0.70) -> List[Dict[str, Any]]:
        """Returns related skills connected to the given skill."""
        if skill_name not in self.graph:
            return []

        related = []
        for neighbor in self.graph.neighbors(skill_name):
            data = self.graph.get_edge_data(skill_name, neighbor)
            if data["weight"] >= min_weight:
                related.append({
                    "skill": neighbor,
                    "relation_type": data["relation_type"],
                    "weight": data["weight"],
                    "category": self.graph.nodes[neighbor].get("category", "general")
                })
        return sorted(related, key=lambda x: x["weight"], reverse=True)

    def evaluate_skill_coverage(
        self, candidate_skills: List[str], required_job_skills: List[str]
    ) -> Dict[str, Any]:
        """
        F1 Core Intelligence:
        Calculates exact matches, transferable matches, and missing skills.
        Never penalizes a candidate with 0 if they possess an implied or transferable skill.
        """
        candidate_set = {s.lower(): s for s in candidate_skills}
        exact_matches = []
        transferable_matches = []
        missing_skills = []

        for req in required_job_skills:
            req_lower = req.lower()

            # 1. Check exact match
            if req_lower in candidate_set:
                exact_matches.append({
                    "required_skill": req,
                    "candidate_skill": candidate_set[req_lower],
                    "match_type": "exact",
                    "weight": 1.0,
                    "explanation": f"Candidate directly possesses {req}."
                })
                continue

            # 2. Check skill graph for implied or alternative skills
            found_transferable = False
            for cand_skill in candidate_skills:
                # Check direct edge in graph
                if self.graph.has_edge(cand_skill, req):
                    edge_data = self.graph.get_edge_data(cand_skill, req)
                    transferable_matches.append({
                        "required_skill": req,
                        "candidate_skill": cand_skill,
                        "match_type": edge_data["relation_type"],
                        "weight": edge_data["weight"],
                        "explanation": f"Possessing {cand_skill} demonstrates foundational capability for {req} ({edge_data['relation_type']})."
                    })
                    found_transferable = True
                    break

            if not found_transferable:
                missing_skills.append(req)

        # Coverage score: exact matches get 1.0, transferable get their edge weight
        total_required = len(required_job_skills) if required_job_skills else 1
        score_sum = sum(m["weight"] for m in exact_matches) + sum(m["weight"] for m in transferable_matches)
        coverage_score = round(min(100.0, (score_sum / total_required) * 100), 1)

        return {
            "coverage_score": coverage_score,
            "exact_matches": exact_matches,
            "transferable_matches": transferable_matches,
            "missing_skills": missing_skills,
            "total_required": len(required_job_skills),
            "matched_count": len(exact_matches) + len(transferable_matches)
        }


# Global singleton instance
skill_graph = SkillGraph()
