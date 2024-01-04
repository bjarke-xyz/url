-- Migration number: 0000 	 2024-01-04T15:37:05.329Z
CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY,
    urlKey TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL,
    createdByIp TEXT,
    url TEXT
);

CREATE INDEX IF NOT EXISTS ix_urls_key ON urls(urlKey);