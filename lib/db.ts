import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { getDatabaseUrl } from './db-config'

let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    _sql = neon(getDatabaseUrl())
  }
  return _sql
}

export const sql: NeonQueryFunction<false, false> = ((
  strings: TemplateStringsArray,
  ...values: unknown[]
) => getSql()(strings, ...values)) as NeonQueryFunction<false, false>
