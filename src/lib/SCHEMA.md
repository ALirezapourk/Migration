# Reference Documentation — .NET Backend Architecture

## SQL Schema (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE candidates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    skills          TEXT[] NOT NULL,
    experience      INT NOT NULL,
    location        VARCHAR(100) NOT NULL,
    work_preference VARCHAR(20) NOT NULL CHECK (work_preference IN ('Remote', 'Onsite', 'Hybrid')),
    availability    VARCHAR(20) NOT NULL CHECK (availability IN ('Immediately', '2 weeks', '1 month', '3 months')),
    work_type       VARCHAR(20) NOT NULL CHECK (work_type IN ('Full-time', 'Contract', 'Freelance')),
    domain          VARCHAR(100) NOT NULL,
    summary         TEXT NOT NULL,
    embedding       vector(1536),  -- OpenAI text-embedding-3-small
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidates_skills ON candidates USING GIN (skills);
CREATE INDEX idx_candidates_experience ON candidates (experience);
CREATE INDEX idx_candidates_embedding ON candidates USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## C# Entity Class

```csharp
public class Candidate
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
    public int Experience { get; set; }
    public string Location { get; set; } = string.Empty;
    public string WorkPreference { get; set; } = string.Empty; // Remote | Onsite | Hybrid
    public string Availability { get; set; } = string.Empty;   // Immediately | 2 weeks | 1 month | 3 months
    public string WorkType { get; set; } = string.Empty;       // Full-time | Contract | Freelance
    public string Domain { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public float[]? Embedding { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

## API Endpoint Contracts

### GET /api/candidates
Query params: `skills`, `minExperience`, `workPreference`, `workType`, `page`, `pageSize`

Response:
```json
{
  "data": [Candidate],
  "success": true,
  "totalCount": 150,
  "page": 1,
  "pageSize": 20
}
```

### POST /api/match-candidates
Request:
```json
{
  "candidates": [Candidate],
  "requirements": {
    "skills": ["React", "TypeScript"],
    "minExperience": 3,
    "workPreference": "Remote",
    "workType": "Full-time",
    "notes": "Looking for FinTech experience"
  }
}
```

Response:
```json
{
  "results": [
    { "id": "uuid", "score": 92, "summary": "Strong match due to..." }
  ]
}
```

### POST /api/candidates/upload-cv
Multipart form: file (PDF/DOC/DOCX, max 10MB)

Response:
```json
{
  "candidateId": "uuid",
  "extractedSkills": ["React", "TypeScript"],
  "success": true
}
```

## Future Architecture Notes

### 3-Stage Search Pipeline
1. **SQL Filtering** — Pre-filter by experience, work preference, work type using indexed columns
2. **Vector Similarity** — pgvector cosine similarity on embeddings (top 50 results)
3. **AI Re-ranking** — Gemini/GPT analysis of top candidates against detailed requirements

### Embedding Pipeline
- Use OpenAI `text-embedding-3-small` (1536 dimensions)
- Generate embeddings from: `{title} | {skills.join(", ")} | {summary} | {domain}`
- Store in `embedding` column, index with IVFFlat (lists=100 for ~300K rows)
- Refresh embeddings on candidate profile update

### CV Parsing
- Accept PDF/DOC/DOCX via multipart upload
- Extract text with Apache Tika or iText
- Use AI to extract: name, skills, experience, domain, summary
- Auto-create candidate profile with generated embedding

### Scale Targets
- 300K candidate profiles
- ~50K monthly searches
- Sub-200ms SQL+vector search, <3s with AI re-ranking
