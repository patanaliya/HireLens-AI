"""
HireLens AI - Demo Seeder Script
Seeds realistic candidate profiles, job postings, and skill evidence
for presentation and demonstration.
"""

from database import engine, SessionLocal, Base
from models import User, Job, CandidateProfile, Resume, Match, GapReport
from security import hash_password

def seed_demo_data():
    print("[1/3] Initializing database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Recruiter
        recruiter = db.query(User).filter_by(email="recruiter@hirelens.ai").first()
        if not recruiter:
            recruiter = User(
                full_name="Sarah Jenkins",
                email="recruiter@hirelens.ai",
                password_hash=hash_password("Recruiter@123"),
                role="recruiter",
                company_name="CloudPulse Technologies"
            )
            db.add(recruiter)
            db.commit()
            print("      [OK] Recruiter created: recruiter@hirelens.ai")

        # 2. Seed Jobs
        job = db.query(Job).filter_by(title="Senior Full-Stack Engineer").first()
        if not job:
            job = Job(
                title="Senior Full-Stack Engineer",
                department="Platform Core",
                location="Bengaluru / Remote",
                description="We are seeking an experienced Full-Stack Engineer to lead development of cloud-native APIs and reactive frontend applications. You will architect high-scale microservices, design event-driven architectures, and mentor junior engineers.",
                requirements_text="Python, FastAPI, React, PostgreSQL, Docker, Kubernetes, CI/CD",
                experience_min=3,
                bias_score=0.0
            )
            db.add(job)
            db.commit()
            print("      [OK] Demo Job created: Senior Full-Stack Engineer")

        # 3. Seed Candidates
        candidates_data = [
            {
                "name": "Priya Sharma",
                "email": "priya.sharma@example.com",
                "headline": "Senior Backend Developer | Python, FastAPI & Distributed Systems",
                "location": "Bengaluru, India",
                "exp": 4.5,
                "edu": "B.Tech in Computer Science - NIT Karnataka",
                "skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "Redis", "REST APIs", "Microservices", "Git"],
                "blind_id": "Candidate #C-4091"
            },
            {
                "name": "Rohan Mehta",
                "email": "rohan.mehta@example.com",
                "headline": "Full-Stack Engineer | React, TypeScript & Node.js",
                "location": "Mumbai, India",
                "exp": 3.0,
                "edu": "B.E. in Information Technology - Mumbai University",
                "skills": ["React", "JavaScript", "TypeScript", "Node.js", "Express.js", "PostgreSQL", "Tailwind CSS"],
                "blind_id": "Candidate #C-4092"
            },
            {
                "name": "Ananya Gupta",
                "email": "ananya.gupta@example.com",
                "headline": "Cloud & DevOps Engineer | Kubernetes, Terraform & AWS",
                "location": "Hyderabad, India",
                "exp": 5.0,
                "edu": "M.Tech in Software Engineering - BITS Pilani",
                "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Python", "Go"],
                "blind_id": "Candidate #C-4093"
            },
            {
                "name": "Vikram Das",
                "email": "vikram.das@example.com",
                "headline": "Software Engineer | Python, Django & SQL Systems",
                "location": "Delhi NCR, India",
                "exp": 2.5,
                "edu": "B.Sc in Computer Science - Delhi University",
                "skills": ["Python", "Django", "SQL", "MySQL", "Git", "HTML", "CSS"],
                "blind_id": "Candidate #C-4094"
            }
        ]

        for c_data in candidates_data:
            existing = db.query(User).filter_by(email=c_data["email"]).first()
            if not existing:
                u = User(
                    full_name=c_data["name"],
                    email=c_data["email"],
                    password_hash=hash_password("Candidate@123"),
                    role="candidate"
                )
                db.add(u)
                db.commit()

                profile = CandidateProfile(
                    user_id=u.id,
                    headline=c_data["headline"],
                    location=c_data["location"],
                    experience_years=c_data["exp"],
                    education=c_data["edu"],
                    skills=c_data["skills"],
                    blind_id=c_data["blind_id"]
                )
                db.add(profile)
                db.commit()
                print(f"      [OK] Seeded Candidate: {c_data['name']} ({c_data['blind_id']})")

        print("[3/3] Demo database seeding completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
