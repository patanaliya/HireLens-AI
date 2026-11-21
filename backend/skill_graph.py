
"""
HireLens AI - Skill Relationship Intelligence & Ontology Graph

Features:
- Exact skill matching
- Directional skill implications
- Related skill detection
- Transferable skill detection
- Explainable skill coverage scoring
"""

from typing import Dict, List, Any
import networkx as nx


class SkillGraph:
    """Directed Skill Graph and Ontology Engine."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self._initialize_ontology()

    def _initialize_ontology(self):
        skills_data = {
            # Programming languages
            "Python": "language",
            "JavaScript": "language",
            "TypeScript": "language",
            "Java": "language",
            "C++": "language",
            "C#": "language",
            "Go": "language",
            "Rust": "language",
            "SQL": "language",
            "HTML": "language",
            "CSS": "language",

            # Frameworks
            "FastAPI": "framework",
            "Flask": "framework",
            "Django": "framework",
            "React": "framework",
            "Next.js": "framework",
            "Vue.js": "framework",
            "Angular": "framework",
            "Node.js": "framework",
            "Express.js": "framework",
            "Spring Boot": "framework",
            ".NET": "framework",
            "Tailwind CSS": "framework",

            # Databases
            "PostgreSQL": "database",
            "MySQL": "database",
            "MongoDB": "database",
            "Redis": "database",
            "Elasticsearch": "database",
            "DynamoDB": "database",
            "SQLite": "database",

            # Cloud and DevOps
            "Docker": "devops",
            "Kubernetes": "devops",
            "AWS": "cloud",
            "GCP": "cloud",
            "Azure": "cloud",
            "Terraform": "devops",
            "CI/CD": "devops",
            "Git": "tools",
            "Linux": "os",
            "Nginx": "devops",

            # AI and Data
            "PyTorch": "ai_ml",
            "TensorFlow": "ai_ml",
            "Machine Learning": "ai_ml",
            "Pandas": "data",
            "NumPy": "data",
            "Scikit-Learn": "ai_ml",
            "NLP": "ai_ml",
            "LLMs": "ai_ml",
            "Vector Databases": "ai_ml",

            # Other skills
            "Team Leadership": "soft",
            "Agile / Scrum": "methodology",
            "System Design": "architecture",
            "Code Review": "practices",
            "Microservices": "architecture",
            "REST APIs": "architecture"
        }

        for skill, category in skills_data.items():
            self.graph.add_node(skill, category=category)

        edges = [
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

        for source, target, relation, weight in edges:
            self.graph.add_edge(
                source,
                target,
                relation_type=relation,
                weight=weight
            )

    @staticmethod
    def _normalize(skill: str) -> str:
        return " ".join(str(skill).strip().lower().split())

    def _find_canonical_skill(self, skill_name: str):
        normalized = self._normalize(skill_name)

        for graph_skill in self.graph.nodes:
            if self._normalize(graph_skill) == normalized:
                return graph_skill

        return None

    def get_related_skills(
        self,
        skill_name: str,
        min_weight: float = 0.70
    ) -> List[Dict[str, Any]]:

        canonical = self._find_canonical_skill(skill_name)

        if canonical is None:
            return []

        related = []

        for neighbor in self.graph.neighbors(canonical):
            data = self.graph.get_edge_data(canonical, neighbor)

            if data["weight"] >= min_weight:
                related.append({
                    "skill": neighbor,
                    "relation_type": data["relation_type"],
                    "weight": data["weight"],
                    "category": self.graph.nodes[neighbor].get(
                        "category",
                        "general"
                    )
                })

        return sorted(
            related,
            key=lambda item: item["weight"],
            reverse=True
        )

    def evaluate_skill_coverage(
        self,
        candidate_skills: List[str],
        required_job_skills: List[str]
    ) -> Dict[str, Any]:

        candidate_skills = candidate_skills or []
        required_job_skills = required_job_skills or []

        # Normalize candidate skills while retaining their original names.
        candidate_map = {}

        for skill in candidate_skills:
            if not isinstance(skill, str) or not skill.strip():
                continue

            canonical = self._find_canonical_skill(skill)
            key = self._normalize(skill)

            candidate_map[key] = {
                "original": skill.strip(),
                "canonical": canonical
            }

        exact_matches = []
        transferable_matches = []
        missing_skills = []

        processed_requirements = set()

        for required_skill in required_job_skills:
            if not isinstance(required_skill, str):
                continue

            required_skill = required_skill.strip()

            if not required_skill:
                continue

            req_key = self._normalize(required_skill)

            if req_key in processed_requirements:
                continue

            processed_requirements.add(req_key)

            # 1. Exact matching
            if req_key in candidate_map:
                exact_matches.append({
                    "required_skill": required_skill,
                    "candidate_skill": candidate_map[req_key]["original"],
                    "match_type": "exact",
                    "weight": 1.0,
                    "explanation": (
                        f"Candidate directly possesses {required_skill}."
                    )
                })
                continue

            # 2. Graph-based matching
            found_transferable = False

            for candidate in candidate_map.values():
                candidate_skill = candidate["original"]
                canonical_candidate = candidate["canonical"]

                if canonical_candidate is None:
                    continue

                canonical_required = self._find_canonical_skill(
                    required_skill
                )

                if canonical_required is None:
                    continue

                if self.graph.has_edge(
                    canonical_candidate,
                    canonical_required
                ):
                    edge_data = self.graph.get_edge_data(
                        canonical_candidate,
                        canonical_required
                    )

                    transferable_matches.append({
                        "required_skill": required_skill,
                        "candidate_skill": candidate_skill,
                        "match_type": edge_data["relation_type"],
                        "weight": edge_data["weight"],
                        "explanation": (
                            f"Candidate possesses {candidate_skill}, "
                            f"which is related to {required_skill} "
                            f"through {edge_data['relation_type']}."
                        )
                    })

                    found_transferable = True
                    break

            if not found_transferable:
                missing_skills.append(required_skill)

        total_required = (
            len(processed_requirements)
            if processed_requirements
            else 0
        )

        score_sum = (
            sum(match["weight"] for match in exact_matches)
            + sum(match["weight"] for match in transferable_matches)
        )

        coverage_score = (
            round((score_sum / total_required) * 100, 1)
            if total_required
            else 0.0
        )

        return {
            "coverage_score": coverage_score,
            "exact_matches": exact_matches,
            "transferable_matches": transferable_matches,
            "missing_skills": missing_skills,
            "total_required": total_required,
            "matched_count": (
                len(exact_matches) + len(transferable_matches)
            )
        }


# Global singleton instance
skill_graph = SkillGraph()
