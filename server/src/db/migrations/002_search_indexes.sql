-- 002_search_indexes.sql: Core search and performance indexes for dataset_records

-- Enable trigram extension for substring and fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Serves default dataset browsing order and date-range queries:
-- SELECT * FROM dataset_records WHERE dataset_id = $1 ORDER BY created_at DESC
CREATE INDEX idx_records_dataset_created ON dataset_records (dataset_id, created_at DESC);

-- Serves single record lookup by ID within a dataset and stable tie-breaking for pagination:
-- SELECT * FROM dataset_records WHERE dataset_id = $1 AND id = $2
CREATE INDEX idx_records_dataset_id ON dataset_records (dataset_id, id);

-- Serves JSONB equality filters (e.g. data @> '{"status":"Active"}') using jsonb_path_ops:
-- SELECT * FROM dataset_records WHERE dataset_id = $1 AND data @> $2
CREATE INDEX idx_records_data_gin ON dataset_records USING GIN (data jsonb_path_ops);

-- Serves full-text search across searchable fields using to_tsquery / plainto_tsquery:
-- SELECT * FROM dataset_records WHERE dataset_id = $1 AND search_vector @@ plainto_tsquery('simple', $2)
CREATE INDEX idx_records_search_vector ON dataset_records USING GIN (search_vector);

-- Serves partial string matches (search_text ILIKE '%term%') and typo-tolerant search:
-- SELECT * FROM dataset_records WHERE dataset_id = $1 AND search_text ILIKE $2
CREATE INDEX idx_records_search_text_trgm ON dataset_records USING GIN (search_text gin_trgm_ops);
