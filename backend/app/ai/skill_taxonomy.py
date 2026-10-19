"""Skill taxonomy and normalization dictionary for HireLens AI."""

SKILL_CATEGORIES = {
    "Programming Languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", 
        "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "SQL", "HTML", "CSS", "Bash", "Shell"
    ],
    "Frontend Frameworks & Libraries": [
        "React", "Vue.js", "Angular", "Next.js", "Nuxt.js", "Svelte", "Redux", 
        "Tailwind CSS", "Bootstrap", "Material-UI", "Vite", "Webpack", "GraphQL"
    ],
    "Backend & APIs": [
        "FastAPI", "Django", "Flask", "Node.js", "Express.js", "NestJS", "Spring Boot", 
        "Ruby on Rails", "ASP.NET Core", "RESTful APIs", "gRPC", "Microservices"
    ],
    "Databases & Caching": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite", 
        "Cassandra", "DynamoDB", "Firebase", "Neo4j", "RabbitMQ", "Kafka"
    ],
    "Cloud & DevOps": [
        "AWS", "Microsoft Azure", "Google Cloud Platform", "Docker", "Kubernetes", 
        "CI/CD", "Terraform", "Ansible", "Linux", "Git", "GitHub Actions", "Nginx"
    ],
    "AI, Machine Learning & Data": [
        "Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", 
        "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy", "HuggingFace", 
        "spaCy", "Sentence Transformers", "LangChain", "Data Analysis", "Big Data", "Spark"
    ],
    "Testing & Quality Assurance": [
        "Pytest", "Jest", "Vitest", "Playwright", "Cypress", "Selenium", "Unit Testing", 
        "Integration Testing", "TDD"
    ],
    "Management & Methodologies": [
        "Agile", "Scrum", "Jira", "System Architecture", "Git", "Leadership", "Code Review"
    ]
}

# Alias map to canonical names
SKILL_ALIASES = {
    "js": "JavaScript",
    "ts": "TypeScript",
    "py": "Python",
    "reactjs": "React",
    "react.js": "React",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "postgres": "PostgreSQL",
    "psql": "PostgreSQL",
    "k8s": "Kubernetes",
    "gcp": "Google Cloud Platform",
    "sklearn": "Scikit-Learn",
    "tailwind": "Tailwind CSS",
    "tf": "TensorFlow",
    "nlp": "Natural Language Processing",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "rest": "RESTful APIs",
    "rest api": "RESTful APIs",
    "restful": "RESTful APIs",
    "fast api": "FastAPI",
    "node": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "next": "Next.js",
    "nextjs": "Next.js",
    "ci cd": "CI/CD",
    "cicd": "CI/CD",
    "gha": "GitHub Actions",
    "github action": "GitHub Actions",
}

ALL_CANONICAL_SKILLS = set()
for cat, skills in SKILL_CATEGORIES.items():
    for s in skills:
        ALL_CANONICAL_SKILLS.add(s)

def normalize_skill(skill: str) -> str:
    """Normalizes a raw skill string to its canonical title-cased name."""
    clean = skill.strip()
    lower = clean.lower()
    
    if lower in SKILL_ALIASES:
        return SKILL_ALIASES[lower]
    
    for canonical in ALL_CANONICAL_SKILLS:
        if canonical.lower() == lower:
            return canonical
            
    return clean.title() if len(clean) > 3 else clean.upper()

def get_skill_category(skill: str) -> str:
    """Finds the category for a given skill."""
    canonical = normalize_skill(skill)
    for cat, skills in SKILL_CATEGORIES.items():
        if canonical in skills:
            return cat
    return "General Technical"
