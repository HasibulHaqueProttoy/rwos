import type postgres from 'postgres';

/**
 * Reads the live database and lists every place it breaks the conventions in
 * docs/DATA_MODEL.md. Integration tests assert the list is empty, so a migration that
 * breaks a rule fails CI instead of reaching production.
 */
export interface ConventionOptions {
  /** Tables allowed to differ, each with the reason (for example a library's own table). */
  exceptions?: Record<string, string>;
}

const NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

interface ColumnRow {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: 'YES' | 'NO';
  character_maximum_length: number | null;
}

export async function findConventionViolations(
  sql: postgres.Sql,
  options: ConventionOptions = {},
): Promise<string[]> {
  const skip = new Set(Object.keys(options.exceptions ?? {}));
  const violations: string[] = [];

  const columns = await sql<ColumnRow[]>`
    select c.table_name, c.column_name, c.data_type, c.udt_name, c.is_nullable,
           c.character_maximum_length
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    order by c.table_name, c.ordinal_position
  `;

  const tables = new Map<string, ColumnRow[]>();
  for (const column of columns) {
    if (skip.has(column.table_name)) continue;
    const list: ColumnRow[] = tables.get(column.table_name) ?? [];
    list.push(column);
    tables.set(column.table_name, list);
  }

  for (const [table, cols] of tables) {
    if (!NAME_PATTERN.test(table)) violations.push(`${table}: table name is not snake_case`);
    const byName = new Map(cols.map((col) => [col.column_name, col]));

    const idColumn = byName.get('id');
    if (!idColumn || idColumn.udt_name !== 'uuid') {
      violations.push(`${table}: needs an "id uuid" column`);
    }
    for (const stamp of ['created_at', 'updated_at']) {
      const col = byName.get(stamp);
      if (!col || col.udt_name !== 'timestamptz' || col.is_nullable !== 'NO') {
        violations.push(`${table}: needs "${stamp} timestamptz not null"`);
      }
    }

    for (const col of cols) {
      const where = `${table}.${col.column_name}`;
      if (!NAME_PATTERN.test(col.column_name)) {
        violations.push(`${where}: column name is not snake_case`);
      }
      if (col.udt_name === 'timestamp') {
        violations.push(`${where}: use timestamptz (UTC), not timestamp without time zone`);
      }
      if (col.udt_name === 'float4' || col.udt_name === 'float8' || col.udt_name === 'money') {
        violations.push(
          `${where}: no floating point or money type; use bigint minor units or numeric`,
        );
      }
      if (col.column_name.endsWith('_minor') && col.udt_name !== 'int8') {
        violations.push(`${where}: money in minor units must be bigint`);
      }
      if (
        (col.column_name === 'currency' || col.column_name.endsWith('_currency')) &&
        !(col.udt_name === 'bpchar' && col.character_maximum_length === 3)
      ) {
        violations.push(`${where}: currency must be char(3)`);
      }
    }
  }

  const primaryKeys = await sql<{ table_name: string; columns: string[] }[]>`
    select cls.relname as table_name,
           array_agg(att.attname order by att.attnum) as columns
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    join pg_attribute att on att.attrelid = cls.oid and att.attnum = any (con.conkey)
    where nsp.nspname = 'public' and con.contype = 'p'
    group by cls.relname
  `;
  const pkByTable = new Map(primaryKeys.map((row) => [row.table_name, row.columns]));
  for (const table of tables.keys()) {
    const pk = pkByTable.get(table);
    if (!pk || pk.length !== 1 || pk[0] !== 'id') {
      violations.push(`${table}: primary key must be "id"`);
    }
  }

  const unindexedForeignKeys = await sql<{ table_name: string; column_name: string }[]>`
    select cls.relname as table_name, att.attname as column_name
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    join pg_attribute att on att.attrelid = cls.oid and att.attnum = con.conkey[1]
    where nsp.nspname = 'public' and con.contype = 'f'
      and not exists (
        select 1 from pg_index idx
        where idx.indrelid = cls.oid and idx.indkey[0] = con.conkey[1]
      )
  `;
  for (const row of unindexedForeignKeys) {
    if (skip.has(row.table_name)) continue;
    violations.push(`${row.table_name}.${row.column_name}: foreign key needs an index`);
  }

  const missingTriggers = await sql<{ table_name: string }[]>`
    select cls.relname as table_name
    from pg_class cls
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    join pg_attribute att on att.attrelid = cls.oid and att.attname = 'updated_at' and not att.attisdropped
    where nsp.nspname = 'public' and cls.relkind in ('r', 'p')
      and not exists (
        select 1 from pg_trigger trg
        where trg.tgrelid = cls.oid and trg.tgname = 'set_updated_at' and not trg.tgisinternal
      )
  `;
  for (const row of missingTriggers) {
    if (skip.has(row.table_name)) continue;
    violations.push(`${row.table_name}: missing the set_updated_at trigger (run pnpm db:migrate)`);
  }

  return violations;
}
