-- Workflow execution run queue
-- Each time a workflow fires for a contact, a run is created.
-- Delayed steps (wait) persist the run here until the CRON picks it up.

CREATE TABLE IF NOT EXISTS workflow_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        TEXT NOT NULL,
  workflow_id   TEXT NOT NULL,
  contact_id    TEXT,
  status        TEXT NOT NULL DEFAULT 'running',   -- running | completed | failed | skipped
  current_step  INT  NOT NULL DEFAULT 0,
  context       JSONB,                              -- contact snapshot + accumulated vars
  next_step_at  TIMESTAMPTZ,                        -- NULL = run immediately; set by wait steps
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_org     ON workflow_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_pending ON workflow_runs(status, next_step_at)
  WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_workflow_runs_contact ON workflow_runs(contact_id);
