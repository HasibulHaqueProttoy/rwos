-- Keeps every table's updated_at current (docs/DATA_MODEL.md conventions).
-- set_updated_at() is the trigger function; ensure_updated_at_triggers() attaches it to every
-- table in the public schema that has an updated_at column and no trigger yet.
-- `pnpm db:migrate` calls ensure_updated_at_triggers() after each run, so new tables get it
-- automatically, and an integration test fails if any table is ever missing it.

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION ensure_updated_at_triggers() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  target record;
  attached integer := 0;
BEGIN
  FOR target IN
    SELECT cls.oid AS table_oid, nsp.nspname AS schema_name, cls.relname AS table_name
    FROM pg_class cls
    JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
    JOIN pg_attribute att ON att.attrelid = cls.oid
    WHERE nsp.nspname = 'public'
      AND cls.relkind IN ('r', 'p')
      AND att.attname = 'updated_at'
      AND NOT att.attisdropped
      AND NOT EXISTS (
        SELECT 1 FROM pg_trigger trg
        WHERE trg.tgrelid = cls.oid AND trg.tgname = 'set_updated_at' AND NOT trg.tgisinternal
      )
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      target.schema_name,
      target.table_name
    );
    attached := attached + 1;
  END LOOP;
  RETURN attached;
END;
$$;
