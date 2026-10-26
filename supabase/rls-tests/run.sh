#!/usr/bin/env bash
# Applies every migration to a throwaway database on a plain Postgres and runs
# the access-rule tests. Usage: DATABASE_URL=postgresql://postgres@localhost:5432/postgres supabase/rls-tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${DATABASE_URL:?Set DATABASE_URL to a Postgres you can create databases on}"
DB=shroom_rls_test
psql "$DATABASE_URL" -qv ON_ERROR_STOP=1 -c "drop database if exists $DB" -c "create database $DB"
TEST_URL="${DATABASE_URL%/*}/$DB"
psql "$TEST_URL" -qv ON_ERROR_STOP=1 -f supabase/rls-tests/local-shim.sql 2>&1 | grep -v -e wal_level -e HINT || true
for f in supabase/migrations/*.sql; do
  psql "$TEST_URL" -qv ON_ERROR_STOP=1 -1 -f "$f"
done
psql "$TEST_URL" -qv ON_ERROR_STOP=1 -o /dev/null -f supabase/rls-tests/rls.test.sql 2>&1 | sed -e 's/^psql:[^ ]* //' -e 's/^NOTICE:  //'
echo "All access-rule tests passed."
