-- Phase 2 Database Schema Migration
-- KSA Market-Entry Copilot
-- Date: 2025-11-08

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- KNOWLEDGE BASE TABLES
-- ============================================================================

-- KB Sources: Metadata about regulation documents
CREATE TABLE IF NOT EXISTS kb_sources (
    source_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_id VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    storage_url TEXT,
    published_on DATE,
    retrieved_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reg_code VARCHAR(50) NOT NULL,
    checksum VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(pack_id, version, reg_code)
);

CREATE INDEX idx_kb_sources_pack_version ON kb_sources(pack_id, version);
CREATE INDEX idx_kb_sources_reg_code ON kb_sources(reg_code);

COMMENT ON TABLE kb_sources IS 'Metadata for regulation source documents';
COMMENT ON COLUMN kb_sources.pack_id IS 'Policy pack identifier (nitaqat, zatca_phase2, etc.)';
COMMENT ON COLUMN kb_sources.version IS 'Regulation version (e.g., v2025.10)';
COMMENT ON COLUMN kb_sources.storage_url IS 'URL to original PDF in object storage';
COMMENT ON COLUMN kb_sources.reg_code IS 'Regulation code for citations';

-- KB Chunks: Text chunks with embeddings for RAG
CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES kb_sources(source_id) ON DELETE CASCADE,
    pack_id VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    section TEXT,
    article TEXT,
    text TEXT NOT NULL,
    embedding vector(1536),
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_kb_chunks_source FOREIGN KEY (source_id) REFERENCES kb_sources(source_id)
);

CREATE INDEX idx_kb_chunks_pack_version ON kb_chunks(pack_id, version);
CREATE INDEX idx_kb_chunks_source ON kb_chunks(source_id);
CREATE INDEX idx_kb_chunks_article ON kb_chunks(article) WHERE article IS NOT NULL;

-- Vector similarity search index (using HNSW for fast approximate search)
CREATE INDEX idx_kb_chunks_embedding ON kb_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

COMMENT ON TABLE kb_chunks IS 'Text chunks with embeddings for semantic search';
COMMENT ON COLUMN kb_chunks.embedding IS 'OpenAI ada-002 embedding (1536 dimensions)';
COMMENT ON COLUMN kb_chunks.section IS 'Section/heading extracted from markdown';
COMMENT ON COLUMN kb_chunks.article IS 'Article number if applicable (e.g., "12.b")';

-- ============================================================================
-- APPLICATION DATA TABLES
-- ============================================================================

-- Projects (future: multi-project support)
CREATE TABLE IF NOT EXISTS projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_url TEXT,
    extracted_text TEXT,
    page_count INTEGER,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_project ON documents(project_id);

-- Analyses (runs)
CREATE TABLE IF NOT EXISTS analyses (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(project_id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(document_id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    locale VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    CHECK (status IN ('queued', 'processing', 'completed', 'partial', 'failed'))
);

CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created ON analyses(created_at DESC);

-- Analysis Packs (per-pack results)
CREATE TABLE IF NOT EXISTS analysis_packs (
    analysis_pack_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(analysis_id) ON DELETE CASCADE,
    pack_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    inputs_json JSONB,
    output_json JSONB,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    CHECK (status IN ('queued', 'extracting', 'analyzing', 'completed', 'failed')),
    UNIQUE(analysis_id, pack_id)
);

CREATE INDEX idx_analysis_packs_analysis ON analysis_packs(analysis_id);
CREATE INDEX idx_analysis_packs_pack ON analysis_packs(pack_id);
CREATE INDEX idx_analysis_packs_status ON analysis_packs(status);

-- Citations (links between checklist items and KB chunks)
CREATE TABLE IF NOT EXISTS citations (
    citation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_pack_id UUID NOT NULL REFERENCES analysis_packs(analysis_pack_id) ON DELETE CASCADE,
    checklist_item_key VARCHAR(100) NOT NULL,
    chunk_id UUID NOT NULL REFERENCES kb_chunks(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(analysis_pack_id, checklist_item_key, chunk_id)
);

CREATE INDEX idx_citations_analysis_pack ON citations(analysis_pack_id);
CREATE INDEX idx_citations_chunk ON citations(chunk_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for kb_sources
CREATE TRIGGER update_kb_sources_updated_at
    BEFORE UPDATE ON kb_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for projects
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function for similarity search (helper)
CREATE OR REPLACE FUNCTION search_kb_chunks(
    query_embedding vector(1536),
    target_pack_id VARCHAR(50),
    target_version VARCHAR(20),
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    text TEXT,
    reg_code VARCHAR(50),
    url TEXT,
    article TEXT,
    section TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.text,
        s.reg_code,
        s.url,
        c.article,
        c.section,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM kb_chunks c
    JOIN kb_sources s ON c.source_id = s.source_id
    WHERE c.pack_id = target_pack_id
    AND c.version = target_version
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Analysis results with pack details
CREATE OR REPLACE VIEW v_analysis_results AS
SELECT 
    a.analysis_id,
    a.status AS analysis_status,
    a.created_at,
    a.completed_at,
    d.filename AS document_name,
    COUNT(ap.analysis_pack_id) AS total_packs,
    COUNT(CASE WHEN ap.status = 'completed' THEN 1 END) AS completed_packs,
    AVG(CASE WHEN ap.score IS NOT NULL THEN ap.score END) AS avg_score
FROM analyses a
LEFT JOIN documents d ON a.document_id = d.document_id
LEFT JOIN analysis_packs ap ON a.analysis_id = ap.analysis_id
GROUP BY a.analysis_id, a.status, a.created_at, a.completed_at, d.filename;

COMMENT ON VIEW v_analysis_results IS 'Summary view of analysis runs with aggregated pack results';

-- View: KB coverage statistics
CREATE OR REPLACE VIEW v_kb_coverage AS
SELECT 
    pack_id,
    version,
    COUNT(DISTINCT source_id) AS source_count,
    COUNT(*) AS chunk_count,
    AVG(token_count) AS avg_chunk_tokens,
    MIN(created_at) AS first_indexed,
    MAX(created_at) AS last_indexed
FROM kb_chunks
GROUP BY pack_id, version;

COMMENT ON VIEW v_kb_coverage IS 'Statistics about knowledge base coverage per pack/version';

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Insert a default project (optional, for testing)
-- INSERT INTO projects (project_id, name, description)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     'Default Project',
--     'Default project for development and testing'
-- ) ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANTS (adjust based on your user setup)
-- ============================================================================

-- Grant permissions to app user (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

