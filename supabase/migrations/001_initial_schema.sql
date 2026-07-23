-- CMMC Audit Helper — Database Schema
-- This runs in the "cmmc" schema, isolated from the public schema.

-- Create the cmmc schema
CREATE SCHEMA IF NOT EXISTS cmmc;

-- Enable UUID extension (if not already enabled)
-- ─── Companies ───
CREATE TABLE cmmc.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cmmc_level SMALLINT CHECK (cmmc_level IN (1, 2)),
  subscription_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (subscription_status IN ('unpaid', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Assessments ───
CREATE TABLE cmmc.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES cmmc.companies(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level IN (1, 2)),
  sprs_score INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Control Responses ───
CREATE TABLE cmmc.control_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES cmmc.assessments(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'yes', 'in_progress', 'not_applicable')),
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, control_id)
);

-- ─── Evidence Files (metadata only — actual files go to Supabase Storage) ───
CREATE TABLE cmmc.evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_response_id UUID NOT NULL REFERENCES cmmc.control_responses(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── POA&M Items ───
CREATE TABLE cmmc.poam_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_response_id UUID NOT NULL REFERENCES cmmc.control_responses(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  responsible_party TEXT DEFAULT '',
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  UNIQUE (control_response_id)
);

-- ─── Payments ───
CREATE TABLE cmmc.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES cmmc.companies(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ───
CREATE INDEX idx_companies_owner ON cmmc.companies(owner_user_id);
CREATE INDEX idx_assessments_company ON cmmc.assessments(company_id);
CREATE INDEX idx_control_responses_assessment ON cmmc.control_responses(assessment_id);
CREATE INDEX idx_evidence_files_response ON cmmc.evidence_files(control_response_id);
CREATE INDEX idx_poam_items_response ON cmmc.poam_items(control_response_id);
CREATE INDEX idx_payments_company ON cmmc.payments(company_id);

-- ─── RLS Policies ───
-- Companies: user can only see/update their own company
ALTER TABLE cmmc.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_owner_access ON cmmc.companies
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Assessments: user can only access assessments for their company
ALTER TABLE cmmc.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessments_company_access ON cmmc.assessments
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM cmmc.companies WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM cmmc.companies WHERE owner_user_id = auth.uid()
    )
  );

-- Control Responses: access through assessment → company chain
ALTER TABLE cmmc.control_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY control_responses_access ON cmmc.control_responses
  FOR ALL
  USING (
    assessment_id IN (
      SELECT a.id FROM cmmc.assessments a
      JOIN cmmc.companies c ON a.company_id = c.id
      WHERE c.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    assessment_id IN (
      SELECT a.id FROM cmmc.assessments a
      JOIN cmmc.companies c ON a.company_id = c.id
      WHERE c.owner_user_id = auth.uid()
    )
  );

-- Evidence Files: access through control_response → assessment → company chain
ALTER TABLE cmmc.evidence_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_files_access ON cmmc.evidence_files
  FOR ALL
  USING (
    control_response_id IN (
      SELECT cr.id FROM cmmc.control_responses cr
      JOIN cmmc.assessments a ON cr.assessment_id = a.id
      JOIN cmmc.companies c ON a.company_id = c.id
      WHERE c.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    control_response_id IN (
      SELECT cr.id FROM cmmc.control_responses cr
      JOIN cmmc.assessments a ON cr.assessment_id = a.id
      JOIN cmmc.companies c ON a.company_id = c.id
      WHERE c.owner_user_id = auth.uid()
    )
  );

-- POA&M Items: access through control_response → assessment → company chain
ALTER TABLE cmmc.poam_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY poam_items_access ON cmmc.poam_items
  FOR ALL
  USING (
    control_response_id IN (
      SELECT cr.id FROM cmmc.control_responses cr
      JOIN cmmc.assessments a ON cr.assessment_id = a.id
      JOIN cmmc.companies c ON a.company_id = c.id
      WHERE c.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    control_response_id IN (
      SELECT cr.id FROM cmmc.control_responses cr
      JOIN cmmc.assessments a ON cr.assessment_id = a.id
      JOIN cmmc.companies c ON a.company_id = c.id
      WHERE c.owner_user_id = auth.uid()
    )
  );

-- Payments: access through company chain
ALTER TABLE cmmc.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_access ON cmmc.payments
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM cmmc.companies WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM cmmc.companies WHERE owner_user_id = auth.uid()
    )
  );

-- ─── Storage RLS Policies ───
-- For the "evidence" bucket. Run these AFTER creating the bucket in Storage dashboard.
-- Policies enforce that users can only access files under their company's folder.

CREATE POLICY "Users can upload to their company folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence'
    AND (SPLIT_PART(name, '/', 1))::UUID IN (
      SELECT id FROM cmmc.companies WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their company evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence'
    AND (SPLIT_PART(name, '/', 1))::UUID IN (
      SELECT id FROM cmmc.companies WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company evidence"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'evidence'
    AND (SPLIT_PART(name, '/', 1))::UUID IN (
      SELECT id FROM cmmc.companies WHERE owner_user_id = auth.uid()
    )
  );
