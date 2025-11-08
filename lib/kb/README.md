# Knowledge Base & RAG Infrastructure

Phase 2 RAG (Retrieval-Augmented Generation) system for citation-backed compliance analysis.

## Overview

The KB system enables semantic search over regulation documents, providing clause-level citations for pack analysis results. It uses:

- **PostgreSQL with pgvector** for vector storage and similarity search
- **OpenAI text-embedding-ada-002** for embeddings (1536 dimensions)
- **Markdown** as the canonical source format
- **Versioned sources** tied to pack versions (e.g., `nitaqat/v2025.10`)

## Architecture

```
regulations/
  └── <pack_id>/
      └── <version>/
          ├── sources.yml          # Metadata
          ├── regulations/         # Official regulations (markdown)
          │   └── *.md
          └── guidelines/          # Implementation guides (markdown)
              └── *.md

Database:
  - kb_sources   → Source metadata
  - kb_chunks    → Text chunks with vector embeddings
  - citations    → Links between analysis items and chunks
```

## Setup

### 1. Install Dependencies

```bash
npm install
# Installs: pg, js-yaml, openai (already in package.json)
```

### 2. Set Up PostgreSQL with pgvector

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# Install pgvector
brew install pgvector

# Create database
createdb ksa_copilot

# Enable pgvector extension
psql ksa_copilot -c "CREATE EXTENSION vector;"
```

#### Option B: Supabase (Recommended for Production)

1. Create project at [supabase.com](https://supabase.com)
2. pgvector is pre-installed
3. Get connection string from Settings → Database

### 3. Run Migration

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/ksa_copilot"

# Or use .env.local
echo "DATABASE_URL=postgresql://user:password@localhost:5432/ksa_copilot" >> .env.local

# Run migration
psql $DATABASE_URL -f db/migrations/2025-11-Phase2.sql
```

Verify:
```sql
-- Check tables
\dt

-- Check pgvector
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check KB stats
SELECT * FROM v_kb_coverage;
```

### 4. Set OpenAI API Key

```bash
export OPENAI_API_KEY="sk-..."
# Or add to .env.local
```

## Usage

### Preparing Regulation Sources

1. **Convert PDFs to Markdown:**
   ```bash
   # For each PDF in sources/ksa/<pack>/
   # Convert to markdown and place in regulations/<pack>/<version>/
   
   # Example tools:
   - pandoc -f pdf -t markdown document.pdf -o document.md
   - Adobe Acrobat: Export to Markdown
   - Online: https://pdf2md.morethan.io/
   ```

2. **Create/Update sources.yml:**
   ```yaml
   pack_id: nitaqat
   version: v2025.10
   
   sources:
     - reg_code: NITAQAT_OVERVIEW
       title: "Nitaqat Program Overview"
       url: "https://hrsd.gov.sa/en/nitaqat"
       storage_url: "s3://bucket/nitaqat_overview.pdf"
       published_on: "2025-01-15"
       files:
         - overview.md
         - requirements.md
   ```

3. **Place markdown files:**
   ```
   regulations/nitaqat/v2025.10/
   ├── sources.yml
   ├── overview.md
   └── requirements.md
   ```

### Ingesting Content

```bash
# Ingest a specific pack
tsx lib/kb/ingest.ts --pack nitaqat --version v2025.10

# Ingest all packs
tsx lib/kb/ingest.ts --all
```

Output:
```
📦 Ingesting pack: nitaqat v2025.10
Found 1 source(s) in sources.yml
Found 2 markdown file(s)

  Processing source: NITAQAT_OVERVIEW
    Reading: regulations/nitaqat/v2025.10/overview.md
    Chunked into 25 chunks (avg 680 tokens)
    Embedding chunk 25/25...
    ✓ Embedded 25 chunks

✅ Successfully ingested 25 chunks for nitaqat v2025.10
```

### Searching the KB

#### Via API

```bash
# Test search
curl "http://localhost:3000/api/kb/search?q=saudization+quota&pack=nitaqat&version=v2025.10&k=5"
```

Response:
```json
{
  "success": true,
  "data": {
    "query": "saudization quota",
    "packId": "nitaqat",
    "version": "v2025.10",
    "resultCount": 5,
    "results": [
      {
        "id": "uuid",
        "regCode": "NITAQAT_OVERVIEW",
        "article": "12.b",
        "section": "Quota Requirements",
        "similarity": "0.876",
        "url": "https://hrsd.gov.sa/...",
        "preview": "The Saudization quota is calculated based on...",
        "fullText": "..."
      }
    ]
  }
}
```

#### Programmatically

```typescript
import { searchChunks } from '@/lib/kb/search';

const results = await searchChunks({
  packId: 'nitaqat',
  version: 'v2025.10',
  query: 'monthly reporting requirements',
  k: 10,
  minSimilarity: 0.7
});

for (const result of results) {
  console.log(`${result.regCode} Article ${result.article}`);
  console.log(`Similarity: ${result.similarity.toFixed(3)}`);
  console.log(result.text);
}
```

## Integration with Packs

### Attaching Citations

In your pack's `analyze()` function:

```typescript
import { searchChunks } from '@/lib/kb/search';

async function analyzeNitaqat(docText: string, inputs: Inputs): Promise<PackResult> {
  const checklist: ChecklistItem[] = [];
  
  // For each checklist item, find supporting citations
  for (const item of checklist) {
    const query = `${item.title} ${item.description}`;
    
    const citations = await searchChunks({
      packId: 'nitaqat',
      version: 'v2025.10',
      query,
      k: 2,
      minSimilarity: 0.7
    });
    
    item.citations = citations.map(c => ({
      chunkId: c.id,
      regCode: c.regCode,
      url: c.url || '',
      article: c.article,
      version: 'v2025.10',
      confidence: c.similarity,
      publishedOn: undefined // Get from kb_sources if needed
    }));
  }
  
  return { status: 'completed', score: 80, checklist, packVersion: 'v2025.10' };
}
```

## Database Schema

### kb_sources

| Column | Type | Description |
|--------|------|-------------|
| source_id | UUID | Primary key |
| pack_id | VARCHAR(50) | Pack identifier |
| version | VARCHAR(20) | Version |
| title | TEXT | Source title |
| url | TEXT | Official URL |
| storage_url | TEXT | PDF location in object storage |
| reg_code | VARCHAR(50) | Citation code (e.g., "NITAQAT_OVERVIEW") |
| published_on | DATE | Official publication date |

### kb_chunks

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source_id | UUID | FK to kb_sources |
| pack_id | VARCHAR(50) | Pack identifier |
| version | VARCHAR(20) | Version |
| text | TEXT | Chunk content |
| embedding | vector(1536) | Ada-002 embedding |
| section | TEXT | Heading/section name |
| article | TEXT | Article number (e.g., "12.b") |
| token_count | INTEGER | Estimated tokens |

## Maintenance

### View KB Stats

```bash
# Via API
curl "http://localhost:3000/api/kb/search"

# Via psql
psql $DATABASE_URL -c "SELECT * FROM v_kb_coverage;"
```

### Re-index a Pack

```bash
# Delete old chunks
psql $DATABASE_URL -c "DELETE FROM kb_chunks WHERE pack_id='nitaqat' AND version='v2025.10';"

# Re-ingest
tsx lib/kb/ingest.ts --pack nitaqat --version v2025.10
```

### Update Regulation

1. Update markdown files
2. Update `published_on` in sources.yml
3. Re-ingest:
   ```bash
   tsx lib/kb/ingest.ts --pack <pack> --version <version>
   ```

## Performance

- **Indexing:** ~50ms per chunk (embedding + insert)
- **Search:** ~50-200ms for 10 results (vector similarity)
- **HNSW Index:** Provides fast approximate nearest neighbor search

### Optimization Tips

1. **Chunk Size:** 600-800 tokens is optimal for ada-002
2. **Overlap:** 80 tokens overlap preserves context across chunks
3. **minSimilarity:** Use 0.7+ to filter low-quality matches
4. **Caching:** Cache embeddings for common queries
5. **Batch Operations:** Use transactions for bulk inserts

## Troubleshooting

### "DATABASE_URL is required"
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/ksa_copilot"
```

### "pgvector extension not found"
```sql
CREATE EXTENSION vector;
```

### "OPENAI_API_KEY is required"
```bash
export OPENAI_API_KEY="sk-..."
```

### Slow Search
- Check HNSW index exists: `\d kb_chunks` should show `idx_kb_chunks_embedding`
- Rebuild index:
  ```sql
  DROP INDEX idx_kb_chunks_embedding;
  CREATE INDEX idx_kb_chunks_embedding ON kb_chunks 
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
  ```

### Low Citation Quality
- Lower `minSimilarity` threshold (try 0.6)
- Improve chunk quality: ensure markdown has clear headings
- Use `hybridSearch()` with keywords for specific terms

## Files

- `lib/kb/chunk.ts` - Markdown chunking utilities
- `lib/kb/db.ts` - Database client
- `lib/kb/ingest.ts` - Ingestion CLI script
- `lib/kb/search.ts` - Search/retrieval functions
- `app/api/kb/search/route.ts` - Debug API endpoint
- `db/migrations/2025-11-Phase2.sql` - Database schema

## Next Steps

1. Convert ZATCA PDFs to markdown
2. Ingest both packs: `tsx lib/kb/ingest.ts --all`
3. Update pack `analyze()` functions to attach citations
4. Build "View Source" panel UI in `/results/[analysisId]`
5. Test end-to-end: upload doc → analysis → view citations

