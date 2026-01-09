#!/usr/bin/env bash
set -euo pipefail

DB="users"

# Rebuild schema + data
psql -d "$DB" -v ON_ERROR_STOP=1 -f db/schema.sql
psql -d "$DB" -v ON_ERROR_STOP=1 -f db/seed.sql

# Quick counts
psql -d "$DB" -c "
select 'tournaments' t, count(*) c from public.tournaments
union all select 'leagues', count(*) from public.leagues
union all select 'teams', count(*) from public.teams
union all select 'matches', count(*) from public.matches;"
