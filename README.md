# url

A URL shortener. Go, SQLite, server-rendered HTML.

## Run

```
make dev
```

Listens on `:3000` and creates `./url.db` on first start. Configuration is
optional; see `.env.example`.

## Docker

The database lives at `/data/url.db`, so mount a volume there or the data is
lost when the container is replaced.

```
docker build -t url .
docker run -p 3000:3000 -v url-data:/data -e BASE_URL=https://example.org url
```

## Importing from Turso

Earlier versions stored urls in Turso. To move that data into the local file:

```
turso db shell <db> .dump > dump.sql
sqlite3 url.db < dump.sql
```
