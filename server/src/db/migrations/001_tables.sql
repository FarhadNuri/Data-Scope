-- 001_tables.sql: Core schema definitions for DataScope

-- 1. Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('ADMIN', 'ANALYST', 'VIEWER')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Datasets metadata table
CREATE TABLE datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text NULL,
  category varchar(50) NOT NULL,
  data_source varchar(100) NOT NULL,
  total_records integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Dynamic dataset field definitions
CREATE TABLE dataset_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  key varchar(50) NOT NULL,
  label varchar(100) NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'boolean')),
  is_filterable boolean NOT NULL DEFAULT true,
  is_sortable boolean NOT NULL DEFAULT true,
  is_searchable boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_dataset_fields_dataset_key UNIQUE (dataset_id, key)
);

-- 4. Records table (JSONB schema + full-text search helpers)
CREATE TABLE dataset_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  search_text text NOT NULL DEFAULT '',
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(search_text, ''))) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Relationships between records (e.g. parent/child, customer/order)
CREATE TABLE record_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL REFERENCES dataset_records(id) ON DELETE CASCADE,
  target_record_id uuid NOT NULL REFERENCES dataset_records(id) ON DELETE CASCADE,
  relation_type varchar(50) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_record_relationships UNIQUE (source_record_id, target_record_id, relation_type)
);

CREATE INDEX idx_record_relationships_source ON record_relationships (source_record_id);
CREATE INDEX idx_record_relationships_target ON record_relationships (target_record_id);

-- 6. Audit log for record changes (survives record deletion: no foreign key on record_id)
CREATE TABLE record_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  dataset_id uuid NOT NULL,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(10) NOT NULL CHECK (action IN ('update', 'delete')),
  old_data jsonb NOT NULL,
  new_data jsonb NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_record_history_record_changed ON record_history (record_id, changed_at DESC);

-- 7. Dataset access control (Admin always has access, others checked here)
CREATE TABLE access_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level varchar(10) NOT NULL CHECK (level IN ('view', 'manage')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_access_permissions UNIQUE (dataset_id, user_id)
);

CREATE INDEX idx_access_permissions_user_dataset ON access_permissions (user_id, dataset_id);

-- 8. Saved search views
CREATE TABLE saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_views_owner ON saved_views (owner_id);
CREATE INDEX idx_saved_views_dataset ON saved_views (dataset_id);

-- 9. Saved view sharing
CREATE TABLE saved_view_shares (
  saved_view_id uuid NOT NULL REFERENCES saved_views(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (saved_view_id, user_id)
);

-- 10. Search query execution history and analytics logging
CREATE TABLE search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  config jsonb NOT NULL,
  config_hash varchar(64) NOT NULL,
  result_count integer NOT NULL,
  took_ms integer NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_history_user_created ON search_history (user_id, created_at DESC);
CREATE INDEX idx_search_history_lookup ON search_history (user_id, dataset_id, config_hash);
CREATE INDEX idx_search_history_dataset_created ON search_history (dataset_id, created_at);

-- 11. Per-user UI preferences
CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
