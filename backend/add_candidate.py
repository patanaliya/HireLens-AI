from database import engine
from sqlalchemy import text

try:
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO candidate_profiles
                (user_id, headline, location, experience_years, education, skills)
                VALUES
                (:uid, :headline, :location, :experience, :education, :skills)
                ON CONFLICT (user_id) DO NOTHING
            """),
            {
                "uid": 1,
                "headline": "Java Developer",
                "location": "Bengaluru",
                "experience": 0,
                "education": "BE Computer Science",
                "skills": ["Java", "Python", "SQL", "React"]
            }
        )

        result = conn.execute(
            text("SELECT * FROM candidate_profiles")
        )

        for candidate in result:
            print(candidate)

    print("Candidate profile added or already exists!")

except Exception as error:
    print("Error:", error)