# CI Postgres with PostGIS + pgvector (schema needs both).
FROM postgis/postgis:17-3.5
RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-17-pgvector \
  && rm -rf /var/lib/apt/lists/*
COPY init-extensions.sql /docker-entrypoint-initdb.d/01-extensions.sql
