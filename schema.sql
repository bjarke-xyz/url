CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY,
    urlKey TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL,
    createdByIp TEXT,
    url TEXT,
    visits INTEGER DEFAULT 0,
    lastVisitedAt TEXT
);

CREATE INDEX IF NOT EXISTS ix_urls_key ON urls(urlKey);
