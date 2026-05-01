-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Add embedding column to paper_chunks (1536 dimensions for OpenAI text-embedding-3-small)
ALTER TABLE "paper_chunks" ADD COLUMN IF NOT EXISTS "embedding" extensions.vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS "paper_chunks_embedding_idx" ON "paper_chunks" 
  USING hnsw ("embedding" extensions.vector_cosine_ops);

-- Create similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding extensions.vector(1536),
  match_project_id uuid,
  match_count int DEFAULT 10,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  paper_id uuid,
  chunk_index int,
  page_start int,
  page_end int,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    paper_chunks.id,
    paper_chunks.paper_id,
    paper_chunks.chunk_index,
    paper_chunks.page_start,
    paper_chunks.page_end,
    paper_chunks.content,
    1 - (paper_chunks.embedding <=> query_embedding) AS similarity
  FROM paper_chunks
  WHERE paper_chunks.project_id = match_project_id
    AND paper_chunks.embedding IS NOT NULL
    AND 1 - (paper_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY paper_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
