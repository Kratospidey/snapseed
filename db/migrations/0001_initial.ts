import { initialSchemaSql } from '@/db/schema/sql';

export const initialMigration = {
  version: 1,
  name: 'initial',
  sql: initialSchemaSql,
} as const;

